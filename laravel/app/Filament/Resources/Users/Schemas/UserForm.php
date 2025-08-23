<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Schemas\Schema;                      // v4 schema container
use Filament\Forms\Components\TextInput;          // ✅ correct namespace
use Filament\Forms\Components\Toggle;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')
                ->required()
                ->maxLength(255),

            TextInput::make('email')
                ->email()
                ->unique(ignoreRecord: true)
                ->required(),

            TextInput::make('password')
                ->password()
                ->revealable()
                ->dehydrateStateUsing(fn (?string $state) => filled($state) ? bcrypt($state) : null)
                ->dehydrated(fn (?string $state) => filled($state))
                ->required(fn (string $operation) => $operation === 'create'),

            Toggle::make('is_admin')->label('Admin'),
        ]);
    }
}
