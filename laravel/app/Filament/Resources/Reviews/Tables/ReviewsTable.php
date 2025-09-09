<?php

namespace App\Filament\Resources\Reviews\Tables;

use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;

// v4 actions
use Filament\Actions\ActionGroup;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

// filters
use Filament\Tables\Filters\SelectFilter;

class ReviewsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->sortable(),

                // Show the polymorphic target nicely, e.g. "Product: Serum X" or "Beauty Expert: Lina A."
                TextColumn::make('reviewable')
                    ->label('Target')
                    ->formatStateUsing(function ($state, $record) {
                        $type = class_basename($record->reviewable_type ?? '');
                        $name = $record->reviewable->name ?? ('#'.$record->reviewable_id);
                        return ($type ? $type.': ' : '') . $name;
                    })
                    ->searchable(),

                // Stars + numeric rating
                TextColumn::make('rating')
                    ->label('Rating')
                    ->formatStateUsing(fn ($state) => str_repeat('★', (int) $state) . ' ' . $state . '/5')
                    ->alignCenter()
                    ->sortable(),

                TextColumn::make('comment')
                    ->limit(60)
                    ->tooltip(fn ($record) => $record->comment)
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])

            // Handy filters
            ->filters([
                SelectFilter::make('rating')
                    ->options([
                        5 => '5 stars',
                        4 => '4 stars',
                        3 => '3 stars',
                        2 => '2 stars',
                        1 => '1 star',
                    ]),
                SelectFilter::make('reviewable_type')
                    ->label('Target type')
                    ->options([
                        \App\Models\Product::class      => 'Product',
                        \App\Models\BeautyExpert::class => 'Beauty Expert',
                    ]),
            ])

            // Row actions (v4)
            ->recordActions([
                ActionGroup::make([
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

            ->defaultSort('created_at', 'desc');
    }
}
