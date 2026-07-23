<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateBuilderController extends Controller
{
    public function show($uuid)
    {
        $template = DocumentTemplate::with('body')->where(function($q) use ($uuid) {
            $q->where('uid', $uuid)->orWhere('id', $uuid);
        })->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => [
                'uuid' => $template->uid ?? (string) $template->id,
                'uid' => $template->uid ?? (string) $template->id,
                'code' => $template->code,
                'name' => $template->name,
                'category' => $template->category,
                'format_nomor' => $template->format_nomor,
                'is_active' => $template->is_active,
                'body' => $template->body ? [
                    'kop_surat' => $template->body->kop_surat,
                    'menimbang' => $template->body->menimbang,
                    'mengingat' => $template->body->mengingat,
                    'memperhatikan' => $template->body->memperhatikan,
                    'body_content' => $template->body->body_content,
                ] : null,
            ]
        ]);
    }

    public function update(Request $request, $uuid)
    {
        $template = DocumentTemplate::where(function($q) use ($uuid) {
            $q->where('uid', $uuid)->orWhere('id', $uuid);
        })->firstOrFail();

        DB::transaction(function () use ($template, $request) {
            // Update header info (optional, mostly done in generic master data but allowed here)
            if ($request->has('code') || $request->has('name') || $request->has('format_nomor')) {
                $template->update($request->only(['code', 'name', 'format_nomor', 'category']));
            }

            // Update or Create Body
            if ($request->has('body')) {
                $bodyData = $request->input('body');
                $template->body()->updateOrCreate(
                    ['template_id' => $template->id],
                    [
                        'kop_surat' => $bodyData['kop_surat'] ?? 'kop_surat.png',
                        'menimbang' => $bodyData['menimbang'] ?? '',
                        'mengingat' => $bodyData['mengingat'] ?? '',
                        'memperhatikan' => $bodyData['memperhatikan'] ?? '',
                        'body_content' => $bodyData['body_content'] ?? '',
                    ]
                );
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Template berhasil disimpan.',
        ]);
    }
}
