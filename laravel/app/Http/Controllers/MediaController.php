<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaController extends Controller
{
    public function show(Request $request, string $path)
    {
        // ----------- sanitize path -----------
        $path = ltrim(str_replace('\\', '/', $path), '/');
        if ($path === '' || str_contains($path, '..')) {
            abort(404);
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            abort(404);
        }

        // ----------- file meta -----------
        $mime  = $disk->mimeType($path) ?: 'application/octet-stream';
        $size  = (int) ($disk->size($path) ?? 0);
        $mtime = (int) ($disk->lastModified($path) ?? time());
        $last  = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';
        $etag  = '"' . md5($path . '|' . $size . '|' . $mtime) . '"';

        // ----------- conditional GET (ETag / Last-Modified) -----------
        $ifNoneMatch = $request->headers->get('If-None-Match');
        $ifModSince  = $request->headers->get('If-Modified-Since');

        if ($ifNoneMatch === $etag || ($ifModSince && strtotime($ifModSince) >= $mtime)) {
            return response('', 304, [
                'Cache-Control' => 'public, max-age=31536000, immutable',
                'ETag'          => $etag,
                'Last-Modified' => $last,
                'Expires'       => gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT',
            ]);
        }

        // ----------- HEAD request (no body) -----------
        if ($request->isMethod('HEAD')) {
            return response('', 200, [
                'Content-Type'      => $mime,
                'Content-Length'    => $size,
                'Cache-Control'     => 'public, max-age=31536000, immutable',
                'ETag'              => $etag,
                'Last-Modified'     => $last,
                'Expires'           => gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT',
                'Accept-Ranges'     => 'bytes',
                'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
            ]);
        }

        // ----------- obtain underlying file path (local driver) -----------
        // This lets us support fast range serving via fseek/readfile loops.
        // If not local, we could still stream via $disk->readStream($path) without ranges.
        $isLocal = config('filesystems.disks.public.driver') === 'local';
        $realPath = $isLocal ? $disk->path($path) : null;

        // ----------- Range support -----------
        $rangeHeader = $request->headers->get('Range'); // e.g., "bytes=0-1023"
        $start = 0;
        $end   = $size > 0 ? $size - 1 : 0;
        $status = 200;

        if ($rangeHeader && preg_match('/bytes=(\d*)-(\d*)/i', $rangeHeader, $m)) {
            if ($m[1] !== '') $start = (int) $m[1];
            if ($m[2] !== '') $end   = (int) $m[2];
            if ($end > $size - 1) $end = $size - 1;
            if ($start < 0 || $start > $end) {
                // Invalid range
                return response('', 416, [
                    'Content-Range' => "bytes */{$size}",
                ]);
            }
            $status = 206;
        }

        $length = ($end - $start) + 1;

        // ----------- stream response -----------
        $headers = [
            'Content-Type'        => $mime,
            'Cache-Control'       => 'public, max-age=31536000, immutable',
            'ETag'                => $etag,
            'Last-Modified'       => $last,
            'Expires'             => gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT',
            'Accept-Ranges'       => 'bytes',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ];

        if ($status === 206) {
            $headers['Content-Range']  = "bytes {$start}-{$end}/{$size}";
            $headers['Content-Length'] = (string) $length;
        } else {
            if ($size > 0) {
                $headers['Content-Length'] = (string) $size;
            }
        }

        // Prefer native file streaming for local driver (best performance & fseek support)
        if ($isLocal && is_file($realPath) && is_readable($realPath)) {
            $response = new StreamedResponse(function () use ($realPath, $start, $length) {
                $chunk = 8192; // 8KB
                $fp = fopen($realPath, 'rb');
                if ($fp === false) {
                    return;
                }
                try {
                    if ($start > 0) {
                        fseek($fp, $start);
                    }
                    $remaining = $length;
                    while ($remaining > 0 && !feof($fp)) {
                        $read = ($remaining > $chunk) ? $chunk : $remaining;
                        $buffer = fread($fp, $read);
                        if ($buffer === false) break;
                        echo $buffer;
                        flush();
                        $remaining -= strlen($buffer);
                    }
                } finally {
                    fclose($fp);
                }
            }, $status, $headers);

            return $response;
        }

        // Fallback: generic Storage stream (no precise range seek on non-local drivers)
        $stream = $disk->readStream($path);
        if (!$stream) {
            abort(404);
        }

        // If a range was requested but we can't seek, we return full content (200).
        // You could implement partial read by discarding until $start if the stream is seekable.
        if ($status === 206) {
            // Try seeking if supported
            if (@fseek($stream, $start) === 0) {
                // great, proceed as 206
            } else {
                // not seekable, downgrade to 200/full
                $status = 200;
                unset($headers['Content-Range'], $headers['Content-Length']);
                if ($size > 0) $headers['Content-Length'] = (string) $size;
            }
        }

        return response()->stream(function () use ($stream, $status, $length) {
            $chunk = 8192;
            $remaining = ($status === 206) ? $length : PHP_INT_MAX;
            while (!feof($stream) && $remaining > 0) {
                $read = ($remaining > $chunk) ? $chunk : $remaining;
                $buffer = fread($stream, $read);
                if ($buffer === false) break;
                echo $buffer;
                flush();
                $remaining -= strlen($buffer);
            }
            fclose($stream);
        }, $status, $headers);
    }
}
