import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MasterDataWorkspace from '../components/MasterDataWorkspace';
import { masterDataModules } from '../data/masterDataCatalog';

const MasterDataManagePage = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const selectedModule = masterDataModules.find((module) => module.id === uuid);

  if (!selectedModule) {
    return <Navigate to="/admin/master-data" replace />;
  }

  return <MasterDataWorkspace moduleId={selectedModule.id} onBack={() => navigate('/admin/master-data')} />;
};

export default MasterDataManagePage;
