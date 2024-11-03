import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Table, Spinner, Alert, Modal } from 'react-bootstrap';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useAuth } from '../AuthContext';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 24,
    marginBottom: 20
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 24,
    padding: 5
  },
  cell: {
    flex: 1,
    padding: 5
  },
  header: {
    backgroundColor: '#f0f0f0'
  }
});

// Componente PDF modificado para no usar Image
const ListPDF = ({ list }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{list.title}</Text>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.row, styles.header]}>
          {Object.keys(list.items[0]?.column_data || {}).map((column) => (
            <Text style={styles.cell} key={column}>
              {column}
            </Text>
          ))}
        </View>

        {/* Datos */}
        {list.items.map((item, index) => (
          <View style={styles.row} key={index}>
            {Object.values(item.column_data).map((value, cellIndex) => (
              <Text style={styles.cell} key={cellIndex}>
                {value}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const ListDetail = () => {
  const { listId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableList, setEditableList] = useState(null);

  useEffect(() => {
    fetchList();
  }, [listId]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          items (
            id,
            column_data,
            created_at
          )
        `)
        .or(`id.eq.${listId},public_id.eq.${listId}`)
        .single();

      if (error) throw error;
      setList(data);
    } catch (err) {
      setError('No se pudo cargar la lista');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [listId]);

  useEffect(() => {
    if (list) {
      setEditableList({ ...list });
    }
  }, [list]);

  const handleItemChange = (itemId, column, value) => {
    setEditableList(prevList => ({
      ...prevList,
      items: prevList.items.map(item =>
        item.id === itemId
          ? { ...item, column_data: { ...item.column_data, [column]: value } }
          : item
      )
    }));
  };

  const handleEdit = async () => {
    if (!user) {
      navigate('/login', { state: { returnUrl: window.location.pathname } });
      return;
    }

    try {
      const { error: listError } = await supabase
        .from('lists')
        .update({ title: editableList.title })
        .eq('id', editableList.id);

      if (listError) throw listError;

      for (let item of editableList.items) {
        const { error: itemError } = await supabase
          .from('items')
          .update({ column_data: item.column_data })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      setList(editableList);
      setEditMode(false);
    } catch (err) {
      setError('Error al actualizar la lista');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!list) {
    return <Alert variant="warning">Lista no encontrada</Alert>;
  }

  const publicUrl = `${window.location.origin}/list/${list?.public_id}`;

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Código QR</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .qr-container {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${document.getElementById('qr-code').innerHTML}
            <p>${publicUrl}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
      <Button 
            variant="info" 
            className="me-2"
            onClick={() => navigate('/')}
          >
            Volver
          </Button>
        <h1>{list.title}</h1>
        <div>
          {user && (
            <Button
              variant="primary"
              className="me-2"
              onClick={() => {
                if (editMode) {
                  handleEdit();
                } else {
                  setEditMode(true);
                }
              }}
            >
              {editMode ? 'Guardar cambios' : 'Editar'}
            </Button>
          )}
          {editMode && (
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => {
                setEditableList({ ...list });
                setEditMode(false);
              }}
            >
              Cancelar
            </Button>
          )}
          <Button
            variant="info"
            className="me-2"
            onClick={() => setShowQRModal(true)}
          >
            Ver QR
          </Button>
          <PDFDownloadLink
            document={<ListPDF list={list} />}
            fileName={`${list.title}.pdf`}
          >
            {({ loading }) => (
              <Button variant="secondary" disabled={loading}>
                {loading ? 'Generando PDF...' : 'Descargar PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            {Object.keys(list.items[0]?.column_data || {}).map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(editMode ? editableList.items : list.items).map((item) => (
            <tr key={item.id}>
              {Object.entries(item.column_data).map(([column, value], index) => (
                <td key={index}>
                  {editMode ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleItemChange(item.id, column, e.target.value)}
                    />
                  ) : (
                    value
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Código QR de la lista</Modal.Title>
  </Modal.Header>
  <Modal.Body className="text-center">
    <div id="qr-code">
      <QRCodeSVG value={publicUrl} size="80%" />
    </div>
    <p className="mt-3">
      <small className="text-muted">
        QR para imprimir directo
      </small>
    </p>
    <p className="mt-2">
      <code>{publicUrl}</code>
    </p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="primary" onClick={handlePrintQR}>
      Imprimir QR
    </Button>
    <Button variant="secondary" onClick={() => setShowQRModal(false)}>
      Cerrar
    </Button>
  </Modal.Footer>
</Modal>
    </div>
  );
};

export default ListDetail;