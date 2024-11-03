import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const CreateListModal = ({ show, handleClose, fetchLists }) => {
  const [formState, setFormState] = useState({
    listTitle: '',
    columns: ['Nombre del ítem'],
    items: [{ 'Nombre del ítem': '' }],
    newColumnName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   const adjustFixedColumnsWidth = () => {
  //     const fixedColumns = document.querySelectorAll('.fixed-column');
  //     fixedColumns.forEach((col, index) => {
  //       const width = col.offsetWidth;
  //       document.documentElement.style.setProperty(`--fixed-column-${index + 1}-width`, `${width}px`);
  //     });
  //   };
  
  //   adjustFixedColumnsWidth();
  //   window.addEventListener('resize', adjustFixedColumnsWidth);
  
  //   return () => {
  //     window.removeEventListener('resize', adjustFixedColumnsWidth);
  //   };
  // }, []);

  const handleItemChange = (index, column, value) => {
    setFormState(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [column]: value };
      return { ...prev, items: newItems };
    });
  };

  const addColumn = () => {
    if (!formState.newColumnName.trim()) return;

    setFormState(prev => {
      const newItems = prev.items.map(item => ({
        ...item,
        [prev.newColumnName]: ''
      }));

      return {
        ...prev,
        columns: [...prev.columns, prev.newColumnName],
        items: newItems,
        newColumnName: ''
      };
    });
  };

  const addItemRow = () => {
    setFormState(prev => {
      const newItem = prev.columns.reduce((acc, col) => {
        acc[col] = '';
        return acc;
      }, {});

      return {
        ...prev,
        items: [...prev.items, newItem]
      };
    });
  };

  const validateForm = () => {
    if (!formState.listTitle.trim()) {
      setError('Por favor, ingresa un título para la lista');
      return false;
    }

    const hasEmptyItems = formState.items.every(item =>
      Object.values(item).every(value => !value.trim())
    );

    if (hasEmptyItems) {
      setError('Agrega al menos un ítem a la lista');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Crear la lista
      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert([{
          title: formState.listTitle,
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (listError) throw listError;

      // Filtrar items vacíos y preparar para inserción
      const validItems = formState.items.filter(item =>
        Object.values(item).some(value => value.trim())
      );

      // Insertar items
      const { error: itemsError } = await supabase
        .from('items')
        .insert(
          validItems.map(item => ({
            list_id: list.id,
            column_data: item,
            created_at: new Date().toISOString()
          }))
        );

      if (itemsError) throw itemsError;

      // Éxito
      await fetchLists();
      handleClose();
      resetForm();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormState({
      listTitle: '',
      columns: ['Nombre del ítem'],
      items: [{ 'Nombre del ítem': '' }],
      newColumnName: ''
    });
    setError(null);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Crear nueva lista</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} >
          <Form.Group className="mb-3">
            <Form.Label>Nombre de la lista</Form.Label>
            <Form.Control
              type="text"
              placeholder="Escribe el nombre de la lista"
              value={formState.listTitle}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                listTitle: e.target.value
              }))}
              disabled={loading}
              required
            />
          </Form.Group>

          {/* <div className="table-container"> */}

          <div className="table-responsive">
            <Table striped bordered hover className="mt-1">
              <thead>
                <tr>
                  {formState.columns.map((col, index) => (
                    <th key={index} className="min-w-[150px]">{col}</th>
                  ))}
                  <th className="d-flex flex-row">
                    <Form.Control
                      type="text"
                      placeholder="Nueva columna"
                      value={formState.newColumnName}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        newColumnName: e.target.value
                      }))}
                      disabled={loading}
                    />
                    <Button
                      className="mt-1"
                      variant="primary"
                      onClick={addColumn}
                      disabled={loading}
                    >
                      +
                    </Button>
                  </th>

                </tr>

              </thead>
              <tbody>
                {formState.items.map((item, rowIndex) => (
                  <tr key={rowIndex}>
                    {formState.columns.map((column, colIndex) => (
                      <td key={`${rowIndex}-${colIndex}`}>
                        <Form.Control
                          type="text"
                          placeholder={`Escribir ${column.toLowerCase()}`}
                          value={item[column] || ''}
                          onChange={(e) => handleItemChange(rowIndex, column, e.target.value)}
                          disabled={loading}
                        />
                      </td>
                    ))}

                  </tr>
                ))}

              </tbody>
            </Table>
          </div>
          {/* </div> */}

          <Button
            className="w-full mt-1"
            onClick={addItemRow}
            disabled={loading}
          >
            Agregar ítem
          </Button>
          <div className='d-flex justify-content-around mt-3'>

            <Button
              variant="success"
              className="w-full mt-1"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Guardando...
                </>
              ) : (
                'Guardar lista'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateListModal;


