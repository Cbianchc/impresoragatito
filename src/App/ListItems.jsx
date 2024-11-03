import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function ListItems({ listId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .eq('list_id', listId)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error al obtener los ítems:', error.message);
      } else {
        setItems(items);
      }
    };

    fetchItems();
  }, [listId]);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.item}</li>
      ))}
    </ul>
  );
}

export default ListItems;
