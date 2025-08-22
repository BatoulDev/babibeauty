<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Schemas\Schema;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->schema([
                // Image
                FileUpload::make('image_path')
                    ->image()
                    ->directory('products')
                    ->disk('public')
                    ->visibility('public')
                    ->imageEditor()
                    ->imageCropAspectRatio('1:1')   // optional
                    ->imageResizeTargetWidth(600)   // optional
                    ->imageResizeTargetHeight(600)  // optional
                    ->required(),

                // Details (stacked; no Grid)
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                TextInput::make('price')
                    ->numeric()
                    ->required(),

                Select::make('brand_id')
                    ->relationship('brand', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),

                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),

                Textarea::make('description')
                    ->rows(4)
                    ->columnSpanFull(),
            ]);
    }
}
