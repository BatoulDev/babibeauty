<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
<<<<<<< HEAD
use Filament\Actions\DeleteAction;
=======
>>>>>>> develop
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;
<<<<<<< HEAD

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
=======
>>>>>>> develop
}
