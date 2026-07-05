<?php

namespace App\Http\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Applies the SPA's shared list-query contract to an index query.
 *
 * The DataTable sends `q` (global search), `sort` (column) and `dir`
 * (`asc|desc`) alongside `page`/`per_page`. This trait turns the first three
 * into SQL; the caller keeps ownership of `per_page` clamping and of the final
 * `->paginate()` / `->get()`, so the `Paginated<T>` response shape is untouched.
 *
 * Reused by every list endpoint (users, roles, activity log, tokens, …) so the
 * contract lives in exactly one place — see the `dont-repeat-yourself` skill.
 */
trait HandlesListQuery
{
    /**
     * Apply `q` search + `sort`/`dir` ordering to an index query.
     *
     * - `q`    : grouped, case-insensitive LIKE across the $searchable columns.
     * - sort   : `ORDER BY $sort $dir`, but only when $sort is one of
     *            $sortable. An unknown / missing / disallowed column falls back
     *            to $defaultSort / $defaultDir — the whitelist is therefore the
     *            sole SQL-injection guard (column names are never taken from
     *            raw input, only from the caller-supplied whitelists).
     *
     * Pagination is intentionally left to the caller.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<int, string>  $sortable  Column names accepted in `sort`.
     * @param  array<int, string>  $searchable  Columns the `q` term matches on.
     * @param  string  $defaultSort  Column ordered by when no valid `sort` is given.
     * @param  'asc'|'desc'  $defaultDir  Direction paired with $defaultSort.
     * @return Builder<TModel>
     */
    protected function applyListQuery(
        Builder $query,
        Request $request,
        array $sortable = [],
        array $searchable = [],
        string $defaultSort = 'id',
        string $defaultDir = 'desc',
    ): Builder {
        // Global search. Guard against array input so `q[]=x` can't blow up.
        $term = is_string($q = $request->input('q')) ? trim($q) : '';

        if ($term !== '' && $searchable !== []) {
            $like = '%'.mb_strtolower($term).'%';

            $query->where(function (Builder $inner) use ($searchable, $like): void {
                foreach ($searchable as $column) {
                    // $column is a developer-supplied whitelist entry, never
                    // raw input — safe to interpolate. LOWER() on both sides
                    // keeps the match case-insensitive on Postgres (LIKE there
                    // is case-sensitive) as well as SQLite.
                    $inner->orWhereRaw('LOWER('.$column.') LIKE ?', [$like]);
                }
            });
        }

        // Ordering. Only a whitelisted column is ever placed in the SQL.
        $sort = is_string($s = $request->input('sort')) ? $s : '';

        if ($sort !== '' && in_array($sort, $sortable, true)) {
            $dir = is_string($d = $request->input('dir')) && strtolower($d) === 'desc' ? 'desc' : 'asc';

            return $query->orderBy($sort, $dir);
        }

        return $query->orderBy($defaultSort, $defaultDir);
    }
}
