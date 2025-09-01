<?php

namespace App\Filament\Resources\BeautyExperts;

use App\Filament\Resources\BeautyExperts\Pages\CreateBeautyExpert;
use App\Filament\Resources\BeautyExperts\Pages\EditBeautyExpert;
use App\Filament\Resources\BeautyExperts\Pages\ListBeautyExperts;
use App\Filament\Resources\BeautyExperts\Schemas\BeautyExpertForm;
use App\Filament\Resources\BeautyExperts\Tables\BeautyExpertsTable;
use App\Models\BeautyExpert;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class BeautyExpertResource extends Resource
{
    protected static ?string $model = BeautyExpert::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return BeautyExpertForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BeautyExpertsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBeautyExperts::route('/'),
            'create' => CreateBeautyExpert::route('/create'),
            'edit' => EditBeautyExpert::route('/{record}/edit'),
        ];
    }
}
