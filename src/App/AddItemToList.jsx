import { useState } from 'react';
import { supabase } from '../supabaseClient';

function AddItemToList({ listId }) {
  const [itemText, setItemText] = useState('');

  const addItem = async () => {
    const { data, error } = await supabase
      .from('items')
      .insert([{ item: itemText, list_id: listId, completed: false }]);

    if (error) {
      console.error('Error al agregar el ítem:', error.message);
    } else {
      console.log('Ítem agregado:', data);
      setItemText('');  // Limpiar el campo después de agregar
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Nuevo ítem"
        value={itemText}
        onChange={(e) => setItemText(e.target.value)}
      />
      <button onClick={addItem}>Agregar Ítem</button>
    </div>
  );
}

export default AddItemToList;
