<?php

namespace App\Filament\Resources\BeautyExperts\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class BeautyExpertForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('specialty')
                    ->default(null),
                Textarea::make('bio')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('phone')
                    ->tel()
                    ->default(null),
                Toggle::make('is_active')
                    ->required(),
            ]);
    }
}
