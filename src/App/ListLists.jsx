import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function ListLists() {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const fetchLists = async () => {
      const user = supabase.auth.user();  // Obtenemos el usuario logueado
      const { data: lists, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)  // Filtramos por el ID del usuario
        .order('id', { ascending: true });

      if (error) {
        console.error('Error al obtener las listas:', error.message);
      } else {
        setLists(lists);
      }
    };

    fetchLists();
  }, []);

  return (
    <div>
      <h2>Mis Listas</h2>
      <ul>
        {lists.map((list) => (
          <li key={list.id}>{list.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default ListLists;
