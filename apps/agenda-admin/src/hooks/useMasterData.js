import { useState, useCallback } from 'react';
import { fetchMasterData, createMasterData, updateMasterData, deleteMasterData } from '../api/masterDataApi';
import { toast } from 'react-toastify';

export const useMasterData = (category) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showSuccess = (title) => {
    toast.success(title);
  };

  const showError = (title, text) => {
    toast.error(`${title}: ${text}`);
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMasterData(category);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      showError('Gagal memuat data', err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const create = async (payload) => {
    try {
      await createMasterData(category, payload);
      showSuccess('Data berhasil ditambahkan');
      await fetch();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to create data');
      showError('Gagal menambah data', err.message);
      throw err;
    }
  };

  const update = async (id, payload) => {
    try {
      await updateMasterData(category, id, payload);
      showSuccess('Data berhasil diperbarui');
      await fetch();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update data');
      showError('Gagal memperbarui data', err.message);
      throw err;
    }
  };

  const remove = async (id) => {
    try {
      await deleteMasterData(category, id);
      showSuccess('Data berhasil dihapus');
      await fetch();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete data');
      showError('Gagal menghapus data', err.message);
      throw err;
    }
  };

  return { data, loading, error, fetch, create, update, remove };
};
