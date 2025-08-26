<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter; // <-- add this import

class MediaController extends Controller
{
    public function show(Request $request, string $path)
    {
        $path = ltrim(str_replace('\\','/',$path), '/');
        if (str_contains($path, '..')) abort(404);

        /** @var FilesystemAdapter $disk */   // <-- tell Intelephense what $disk is
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) abort(404);

        $mime  = $disk->mimeType($path) ?: 'application/octet-stream';
        $size  = $disk->size($path) ?: null;
        $mtime = $disk->lastModified($path);
        $last  = gmdate('D, d M Y H:i:s', $mtime).' GMT';
        $etag  = '"'.md5($path.'|'.$size.'|'.$mtime).'"';

        if ($request->headers->get('If-None-Match') === $etag ||
            strtotime($request->headers->get('If-Modified-Since') ?? '') >= $mtime) {
            return response('', 304, [
                'Cache-Control' => 'public, max-age=31536000, immutable',
                'ETag'          => $etag,
                'Last-Modified' => $last,
            ]);
        }

        $stream = $disk->readStream($path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
        }, 200, [
            'Content-Type'    => $mime,
            'Content-Length'  => $size,
            'Cache-Control'   => 'public, max-age=31536000, immutable',
            'ETag'            => $etag,
            'Last-Modified'   => $last,
            'Accept-Ranges'   => 'bytes',
            'Content-Disposition' => 'inline; filename="'.basename($path).'"',
        ]);
    }
}
