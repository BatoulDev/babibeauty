<?php

namespace App\Filament\Resources\BeautyExperts\Pages;

use App\Filament\Resources\BeautyExperts\BeautyExpertResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBeautyExperts extends ListRecords
{
    protected static string $resource = BeautyExpertResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
