<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NotulaRequest;
use App\Http\Resources\NotulaResource;
use App\Models\Notula;
use Illuminate\Http\Request;

class NotulaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Notula::with(['agenda.participants.employee', 'creator']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('agenda', function ($q2) use ($search) {
                      $q2->where('title', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status') && $request->status != '' && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }
        
        if ($request->has('start_date') && $request->start_date != '') {
            $query->where(function($q) use ($request) {
                $q->whereDate('created_at', '>=', $request->start_date)
                  ->orWhereHas('agenda', function($q2) use ($request) {
                      $q2->whereDate('start_date', '>=', $request->start_date);
                  });
            });
        }

        if ($request->has('end_date') && $request->end_date != '') {
            $query->where(function($q) use ($request) {
                $q->whereDate('created_at', '<=', $request->end_date)
                  ->orWhereHas('agenda', function($q2) use ($request) {
                      $q2->whereDate('start_date', '<=', $request->end_date);
                  });
            });
        }

        $notulas = $query->latest()->paginate($request->per_page ?? 12);

        return $this->successResponse([
            'items' => NotulaResource::collection($notulas->items()),
            'total' => $notulas->total(),
            'current_page' => $notulas->currentPage(),
            'last_page' => $notulas->lastPage(),
            'per_page' => $notulas->perPage(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(NotulaRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $notula = Notula::create($data);

        return $this->successResponse(new NotulaResource($notula->load(['agenda', 'creator'])), 'Notula berhasil dibuat', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Notula $notula)
    {
        return $this->successResponse(new NotulaResource($notula->load(['agenda.participants.employee', 'creator'])));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(NotulaRequest $request, Notula $notula)
    {
        $notula->update($request->validated());

        return $this->successResponse(new NotulaResource($notula->load(['agenda', 'creator'])), 'Notula berhasil diupdate');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Notula $notula)
    {
        $notula->delete();

        return $this->successResponse(null, 'Notula berhasil dihapus');
    }

    /**
     * Add a participant to the agenda associated with this notula
     */
    public function addParticipant(Request $request, string $uid)
    {
        $notula = Notula::where('uid', $uid)->firstOrFail();
        
        $request->validate([
            'employee_id' => 'nullable|integer|exists:ref_pegawai,id',
            'guest_name' => 'nullable|string|max:150',
            'guest_nip' => 'nullable|string|max:50',
            'guest_institution' => 'nullable|string|max:150',
        ]);

        if (!$notula->trx_agenda_id) {
            return $this->errorResponse('Notula is not associated with an agenda', null, 400);
        }

        $participant = \App\Models\AgendaParticipant::create([
            'trx_agenda_id' => $notula->trx_agenda_id,
            'ref_employee_id' => $request->employee_id,
            'guest_name' => $request->guest_name,
            'guest_nip' => $request->guest_nip,
            'guest_institution' => $request->guest_institution,
        ]);

        return $this->successResponse($participant->load('employee'), 'Peserta berhasil ditambahkan', 201);
    }

    /**
     * Remove a participant from the agenda associated with this notula
     */
    public function removeParticipant(Request $request, string $uid, $participantId)
    {
        $notula = Notula::where('uid', $uid)->first();
        if (!$notula || !$notula->trx_agenda_id) {
            return $this->errorResponse('Notula is not associated with an agenda or not found', null, 400);
        }

        $participant = \App\Models\AgendaParticipant::where('id', $participantId)
            ->where('trx_agenda_id', $notula->trx_agenda_id)
            ->first();

        if (!$participant) {
            return $this->errorResponse('Peserta tidak ditemukan untuk dihapus.', [
                'participantId' => $participantId, 
                'notula_trx_agenda_id' => $notula->trx_agenda_id,
                'exists' => \App\Models\AgendaParticipant::where('id', $participantId)->exists()
            ], 404);
        }

        $participant->delete();

        return $this->successResponse(null, 'Peserta berhasil dihapus');
    }
}
