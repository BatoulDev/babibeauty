<?php

namespace App\Filament\Resources\BeautyExperts\Pages;

use App\Filament\Resources\BeautyExperts\BeautyExpertResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditBeautyExpert extends EditRecord
{
    protected static string $resource = BeautyExpertResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
