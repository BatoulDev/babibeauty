<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
<<<<<<< HEAD
use Filament\Actions\CreateAction;
=======
>>>>>>> develop
use Filament\Resources\Pages\ListRecords;

class ListUsers extends ListRecords
{
    protected static string $resource = UserResource::class;
<<<<<<< HEAD

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
=======
>>>>>>> develop
}
