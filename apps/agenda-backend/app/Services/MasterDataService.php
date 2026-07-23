<?php

namespace App\Services;

use App\Models\AgendaCategory;
use App\Models\Room;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\DocumentTemplate;
use App\Models\AgendaPriority;
use Exception;
use Illuminate\Support\Str;

class MasterDataService
{
    public function getCategoryConfig(string $category)
    {
        switch ($category) {
            case 'kategori-agenda':
                return [
                    'model' => AgendaCategory::class,
                    'mapper' => function($item) {
                        return [
                            'id' => $item->id,
                            'uuid' => (string) $item->id,
                            'code' => 'KAT-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                            'name' => $item->name,
                            'scope' => 'Agenda',
                            'status' => $item->is_active ? 'Aktif' : 'Nonaktif',
                            'group' => 'Kategori',
                            'owner' => 'Sistem',
                            'usageCount' => 0,
                            'updatedAt' => $item->updated_at ? $item->updated_at->format('Y-m-d') : null,
                            'description' => $item->description ?? '',
                            'linkedModules' => ['Agenda'],
                        ];
                    }
                ];
            case 'lokasi-kegiatan':
                return [
                    'model' => Room::class,
                    'mapper' => function($item) {
                        return [
                            'id' => $item->id,
                            'uuid' => (string) ($item->uid ?? $item->id),
                            'code' => $item->code ?? 'LOK-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                            'name' => $item->name,
                            'scope' => $item->location ?? 'Internal',
                            'status' => $item->is_active ? 'Aktif' : 'Nonaktif',
                            'group' => 'Ruangan',
                            'owner' => 'Rumah Tangga',
                            'usageCount' => $item->capacity ?? 0,
                            'updatedAt' => $item->updated_at ? $item->updated_at->format('Y-m-d') : null,
                            'description' => $item->description ?? '',
                            'linkedModules' => ['Agenda'],
                        ];
                    }
                ];
            case 'divisi-unit':
                return [
                    'model' => Unit::class,
                    'mapper' => function($item) {
                        return [
                            'id' => $item->id,
                            'uuid' => (string) ($item->uid ?? $item->id),
                            'code' => $item->code ?? 'DIV-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                            'name' => $item->name,
                            'scope' => 'Struktural',
                            'status' => 'Aktif',
                            'group' => 'Divisi',
                            'owner' => 'Kepegawaian',
                            'usageCount' => 0,
                            'updatedAt' => $item->updated_at ? $item->updated_at->format('Y-m-d') : null,
                            'description' => $item->description ?? '',
                            'linkedModules' => ['Agenda', 'Pegawai'],
                        ];
                    }
                ];
            case 'master-pegawai':
                return [
                    'model' => Employee::class,
                    'mapper' => function($item) {
                        return [
                            'id' => $item->id,
                            'uuid' => (string) $item->id,
                            'code' => $item->nip ?? 'PEG-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                            'name' => $item->nama,
                            'scope' => $item->status_pegawai ?? 'Pegawai',
                            'status' => $item->is_status ? 'Aktif' : 'Nonaktif',
                            'group' => 'Pegawai',
                            'owner' => 'Kepegawaian',
                            'usageCount' => 0,
                            'updatedAt' => $item->updated_at ? $item->updated_at->format('Y-m-d') : null,
                            'description' => $item->gender ?? '',
                            'linkedModules' => ['Agenda'],
                            'unit_id' => $item->unit_id,
                            'unit_name' => $item->joined_unit_name ?? '',
                            'gender' => $item->gender,
                        ];
                    }
                ];
            case 'template-surat':
                return [
                    'model' => DocumentTemplate::class,
                    'mapper' => function($item) {
                        return [
                            'id' => $item->id,
                            'uuid' => $item->uid ?? (string) $item->id,
                            'uid' => $item->uid ?? (string) $item->id,
                            'code' => $item->code ?? 'TPL-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                            'name' => $item->name,
                            'scope' => $item->category ?? 'Surat',
                            'status' => $item->is_active ? 'Aktif' : 'Nonaktif',
                            'group' => 'Template',
                            'owner' => 'Administrasi',
                            'usageCount' => 0,
                            'updatedAt' => $item->updated_at ? $item->updated_at->format('Y-m-d') : null,
                            'description' => 'Format: ' . $item->format_nomor,
                            'linkedModules' => ['Dokumen'],
                            'category' => $item->category,
                            'kop_surat' => $item->body->kop_surat ?? null,
                            'format_nomor' => $item->format_nomor,
                            'menimbang' => $item->body->menimbang ?? '',
                            'mengingat' => $item->body->mengingat ?? '',
                            'memperhatikan' => $item->body->memperhatikan ?? '',
                            'body_content' => $item->body->body_content ?? '',
                        ];
                    }
                ];
            case 'prioritas-agenda':
                return [
                    'model' => AgendaPriority::class,
                    'mapper' => function($item) {
                        return [
                            'id' => $item->id,
                            'uuid' => (string) $item->id,
                            'code' => $item->code ?? 'PRI-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                            'name' => $item->name,
                            'scope' => 'SLA ' . $item->sla_days . ' Hari',
                            'status' => $item->is_active ? 'Aktif' : 'Nonaktif',
                            'group' => 'Prioritas',
                            'owner' => 'Sistem',
                            'usageCount' => 0,
                            'updatedAt' => $item->updated_at ? $item->updated_at->format('Y-m-d') : null,
                            'description' => 'Warna: ' . $item->color_hex,
                            'linkedModules' => ['Agenda'],
                            'sla_days' => $item->sla_days,
                            'color_hex' => $item->color_hex,
                        ];
                    }
                ];
            default:
                throw new Exception("Kategori master data tidak valid: {$category}");
        }
    }

    public function getAll(string $category)
    {
        $config = $this->getCategoryConfig($category);
        $modelClass = $config['model'];
        
        if ($category === 'master-pegawai') {
            $items = $modelClass::leftJoin('ref_units', 'ref_pegawai.unit_id', '=', 'ref_units.id')
                ->select('ref_pegawai.*', 'ref_units.name as joined_unit_name')
                ->get();
        } else if ($category === 'template-surat') {
            $items = $modelClass::with('body')->get();
        } else {
            $items = $modelClass::all();
        }
        
        return $items->map($config['mapper']);
    }

    public function create(string $category, array $data)
    {
        $config = $this->getCategoryConfig($category);
        $modelClass = $config['model'];
        
        $mappedData = $this->mapToDatabaseFields($category, $data);
        
        $item = $modelClass::create($mappedData);
        return $config['mapper']($item);
    }

    public function update(string $category, $id, array $data)
    {
        $config = $this->getCategoryConfig($category);
        $modelClass = $config['model'];
        
        if ($category === 'divisi-unit' || $category === 'lokasi-kegiatan') {
            $item = $modelClass::where('uid', $id)->orWhere('id', $id)->firstOrFail();
        } else {
            $item = $modelClass::findOrFail($id);
        }
        
        $mappedData = $this->mapToDatabaseFields($category, $data);
        $item->update($mappedData);
        
        return $config['mapper']($item);
    }

    public function delete(string $category, $id)
    {
        $config = $this->getCategoryConfig($category);
        $modelClass = $config['model'];
        
        if ($category === 'divisi-unit' || $category === 'lokasi-kegiatan') {
            $item = $modelClass::where('uid', $id)->orWhere('id', $id)->firstOrFail();
        } else {
            $item = $modelClass::findOrFail($id);
        }
        
        $item->delete();
        return true;
    }

    private function mapToDatabaseFields(string $category, array $data)
    {
        $isActive = isset($data['status']) ? ($data['status'] === 'Aktif') : true;

        switch ($category) {
            case 'kategori-agenda':
                return [
                    'name' => $data['name'] ?? '',
                    'description' => $data['description'] ?? '',
                    'is_active' => $isActive,
                ];
            case 'lokasi-kegiatan':
                return [
                    'code' => $data['code'] ?? '',
                    'name' => $data['name'] ?? '',
                    'capacity' => (int) ($data['usageCount'] ?? 0),
                    'location' => $data['scope'] ?? '',
                    'is_active' => $isActive,
                ];
            case 'divisi-unit':
                return [
                    'code' => $data['code'] ?? '',
                    'name' => $data['name'] ?? '',
                    'description' => $data['description'] ?? '',
                ];
            case 'master-pegawai':
                return [
                    'nip' => $data['code'] ?? '',
                    'nama' => $data['name'] ?? '',
                    'status_pegawai' => $data['scope'] ?? '',
                    'is_status' => $isActive,
                    'gender' => $data['gender'] ?? '1',
                    'unit_id' => !empty($data['unit_id']) ? $data['unit_id'] : null,
                ];
            case 'template-surat':
                return [
                    'code' => $data['code'] ?? '',
                    'name' => $data['name'] ?? '',
                    'category' => $data['category'] ?? ($data['scope'] ?? 'Surat Tugas'),
                    'kop_surat' => isset($data['kop_surat']) && is_string($data['kop_surat']) ? json_decode($data['kop_surat'], true) : ($data['kop_surat'] ?? null),
                    'format_nomor' => $data['format_nomor'] ?? ($data['description'] ?? ''),
                    'menimbang' => $data['menimbang'] ?? '',
                    'mengingat' => $data['mengingat'] ?? '',
                    'memperhatikan' => $data['memperhatikan'] ?? '',
                    'body_content' => $data['body_content'] ?? '',
                    'is_active' => $isActive,
                ];
            case 'prioritas-agenda':
                return [
                    'code' => $data['code'] ?? '',
                    'name' => $data['name'] ?? '',
                    'sla_days' => (int) ($data['sla_days'] ?? 1),
                    'color_hex' => $data['color_hex'] ?? '#000000',
                    'is_active' => $isActive,
                ];
            default:
                return [];
        }
    }
}
