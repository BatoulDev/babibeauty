<?php

namespace App\Filament\Resources\Reviews\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class ReviewForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                TextInput::make('rating')
                    ->required()
                    ->numeric(),
                Textarea::make('comment')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('reviewable_type')
                    ->required(),
                TextInput::make('reviewable_id')
                    ->required()
                    ->numeric(),
            ]);
    }
}
