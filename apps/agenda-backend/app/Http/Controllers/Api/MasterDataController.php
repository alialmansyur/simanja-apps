<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MasterDataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class MasterDataController extends Controller
{
    protected MasterDataService $masterDataService;

    public function __construct(MasterDataService $masterDataService)
    {
        $this->masterDataService = $masterDataService;
    }

    public function index(string $category): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info("MasterDataController@index hit with category: " . $category);
        try {
            $data = $this->masterDataService->getAll($category);
            return $this->successResponse($data);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error("MasterDataController error: " . $e->getMessage());
            return $this->errorResponse($e->getMessage(), null, 400);
        }
    }

    public function store(Request $request, string $category): JsonResponse
    {
        if (!$request->user()->hasRole(['Super Admin', 'Admin'])) {
            return $this->errorResponse('Unauthorized', null, 403);
        }
        
        try {
            $data = $this->masterDataService->create($category, $request->all());
            return $this->successResponse($data, 'Created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 400);
        }
    }

    public function update(Request $request, string $category, string $id): JsonResponse
    {
        if (!$request->user()->hasRole(['Super Admin', 'Admin'])) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        try {
            $data = $this->masterDataService->update($category, $id, $request->all());
            return $this->successResponse($data, 'Updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 400);
        }
    }

    public function destroy(string $category, string $id): JsonResponse
    {
        if (!$request->user()->hasRole(['Super Admin', 'Admin'])) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        try {
            $this->masterDataService->delete($category, $id);
            return $this->successResponse(null, 'Deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 400);
        }
    }
}
