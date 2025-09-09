<?php

namespace App\Filament\Resources\Bookings\Tables;

use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;

use Filament\Actions\ActionGroup;     // v4 actions namespace
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\Filter;
use Filament\Forms\Components\DatePicker;

class BookingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')               // <— relationship column
                    ->label('Customer')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('beautyExpert.name')       // <— adjust to your relation name
                    ->label('Expert')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('starts_at')
                    ->label('Starts')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),

                TextColumn::make('ends_at')
                    ->label('Ends')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'confirmed' => 'success',
                        'pending'   => 'warning',
                        'cancelled' => 'danger',
                        default     => 'gray',
                    })
                    ->sortable(),

                TextColumn::make('price')
                    ->money('USD', true)
                    ->alignRight()
                    ->sortable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->sortable(),

                TextColumn::make('updated_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->sortable(),
            ])

            // Filters (status + date range)
            ->filters([
                SelectFilter::make('status')->options([
                    'pending'   => 'Pending',
                    'confirmed' => 'Confirmed',
                    'cancelled' => 'Cancelled',
                ]),
                Filter::make('starts_between')
                    ->label('Starts between')
                    ->form([
                        DatePicker::make('from'),
                        DatePicker::make('until'),
                    ])
                    ->query(fn ($query, array $data) => $query
                        ->when($data['from']  ?? null, fn ($q, $date) => $q->whereDate('starts_at', '>=', $date))
                        ->when($data['until'] ?? null, fn ($q, $date) => $q->whereDate('starts_at', '<=', $date))
                    ),
            ])

            // Row actions (v4 uses recordActions + Filament\Actions)
            ->recordActions([
                ActionGroup::make([
                    EditAction::make(),
                    DeleteAction::make(),
                ]),
            ])

            // Bulk actions live in the toolbar/header in v4
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])

            ->defaultSort('starts_at', 'desc');
    }
}
