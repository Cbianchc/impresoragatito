import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../supabaseClient';
import CreateListModal from './modals/CreateListModal';
import { Spinner, Alert } from 'react-bootstrap';
import '../App.css';
import IMG from '../assets/Images';

function CreateList() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleViewList = (listId) => {
    navigate(`/list/${listId}`);
  };

  const fetchLists = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();

      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select(`
          id,
          title,
          created_at,
          items (
            id,
            column_data
          )
        `)
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      setLists(listsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className='montador_app text-center'>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}


      {/* Botón de "Crear lista" con diseño suave */}
      <div className="card p-1 mx-auto d-flex flex-column align-items-center"
        style={{ maxWidth: '400px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>

        {/* Imagen centrada */}
        <img
          src={IMG.imagenLogo}
          alt="Logo"
          className="d-block mb-4 rounded"
          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
        />

        {/* Botón "Crear lista" */}
        <button
          type="button"
          className="btn btn-success w-100"
          style={{ borderRadius: '30px', backgroundColor: '#a8e6cf', border: 'none' }}
          onClick={handleShow}
        >
          Crear lista
        </button>

        <CreateListModal
          show={showModal}
          handleClose={handleClose}
          fetchLists={fetchLists}
        />
      </div>


      {/* Sección de listas */}
      <div className="mt-4">
        {lists.length > 0 ? (
          <div className="row row-cols-1 g-4">
            {lists.map((list) => (
              <div key={list.id} className="col">
                {/* Tarjetas de listas más elegantes */}
                <div className="card h-100 shadow-sm" style={{ borderRadius: '15px' }}>
                  <div className="card-body">
                    <h5 className="card-title">{list.title}</h5>
                    <p className="card-text text-muted">
                      {new Date(list.created_at).toLocaleDateString()}
                    </p>
                    <p className="card-text">
                      {list.items.length} items
                    </p>
                    <button
                      className="btn btn-primary w-100"
                      style={{ borderRadius: '30px', backgroundColor: '#ffb6b9', border: 'none' }}
                      onClick={() => handleViewList(list.id)}
                    >
                      Ver
                    </button>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-4">
            <p>No tienes listas guardadas.</p>
            <button
              className="btn btn-primary"
              style={{ borderRadius: '30px', backgroundColor: '#ffb6b9', border: 'none' }}
              onClick={handleShow}
            >
              Crear tu primera lista
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateList;
