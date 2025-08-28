<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Product;

class MakeProductWebp extends Command
{
    protected $signature = 'images:make-webp {--q=82 : WebP quality (0-100)} {--only=* : Only paths containing this substring}';
    protected $description = 'Generate .webp copies for product images stored on the public disk';

    public function handle()
    {
        $q = (int) $this->option('q');
        $only = (array) $this->option('only');
        $disk = Storage::disk('public');

        $paths = Product::pluck('image_path')->filter();
        if (!empty($only)) {
            $paths = $paths->filter(function ($p) use ($only) {
                foreach ($only as $needle) {
                    if ($needle !== null && $needle !== '' && str_contains($p, $needle)) return true;
                }
                return empty($only[0]); // if --only not provided effectively
            });
        }

        $bar = $this->output->createProgressBar($paths->count());
        $bar->start();

        $ok=0; $skip=0; $bad=0;

        foreach ($paths as $rel) {
            $bar->advance();

            $src = $disk->path($rel);
            if (!file_exists($src)) { $this->line("\nmissing: $rel"); $bad++; continue; }

            $dstRel = preg_replace('/\.(jpe?g|png)$/i', '.webp', $rel);
            $dst = $disk->path($dstRel);

            [$w,$h,$type] = @getimagesize($src);
            if (!$w) { $this->line("\nbad: $rel"); $bad++; continue; }

            if ($type === IMAGETYPE_JPEG) {
                $im = @imagecreatefromjpeg($src);
            } elseif ($type === IMAGETYPE_PNG) {
                $im = @imagecreatefrompng($src);
                if (!$im) { $this->line("\nbadpng: $rel"); $bad++; continue; }
                imagepalettetotruecolor($im);
                imagealphablending($im, true);
                imagesavealpha($im, true);
            } else {
                $skip++; continue;
            }

            imagewebp($im, $dst, max(0, min(100, $q)));
            imagedestroy($im);
            $ok++;
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Done. ok=$ok, skip=$skip, bad=$bad");
        return self::SUCCESS;
    }
}
