<?php

namespace App\Filament\Resources\Brands\Tables;

use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;

// v4 actions (unified namespace)
use Filament\Actions\ActionGroup;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
// use Filament\Actions\ViewAction; // ← uncomment + add to ActionGroup if you have a View page

class BrandsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Brand')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])

            // Row actions (v4)
            ->recordActions([
                ActionGroup::make([
                    // ViewAction::make(), // ← only if you defined a View page & route in the Resource
                    EditAction::make(),
                    DeleteAction::make(),
                ]),
            ])

            // Bulk actions (toolbar in v4)
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])

            ->defaultSort('name', 'asc');
    }
}
