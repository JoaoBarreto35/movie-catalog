import { supabase } from "../lib/supabaseClient";


// Tipagem para itens da lista
export interface ListItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'movie' | 'series';
  list_type: 'watchlist' | 'favorites';
  created_at: string;
}

/**
 * Adiciona um item à lista do usuário
 * @param itemId - ID do filme/série
 * @param itemType - Tipo do item (movie/series)
 * @param listType - Tipo de lista (watchlist/favorites)
 */
export async function addToList(
  itemId: string,
  itemType: 'movie' | 'series',
  listType: 'watchlist' | 'favorites'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_to_list', {
      p_item_id: itemId,
      p_item_type: itemType,
      p_list_type: listType
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao adicionar item à lista:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove um item da lista do usuário
 * @param itemId - ID do filme/série
 * @param listType - Tipo de lista (watchlist/favorites)
 */
export async function removeFromList(
  itemId: string,
  listType: 'watchlist' | 'favorites'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('remove_from_list', {
      p_item_id: itemId,
      p_list_type: listType
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao remover item da lista:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtém os itens da lista do usuário
 * @param listType - Tipo de lista (watchlist/favorites)
 * @param itemType - Tipo de item opcional para filtrar (movie/series)
 */
/**
 * Obtém os itens da lista do usuário
 */
export async function getUserList(
    listType: 'watchlist' | 'favorites',
    itemType?: 'movie' | 'series'
  ) {
    try {
      let query = supabase
        .from('my_lists')
        .select('*')
        .eq('list_type', listType);
        
      if (itemType) {
        query = query.eq('item_type', itemType);
      }
      
      const { data, error } = await query.order('id', { ascending: false });
      
      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error('Erro ao obter lista:', error);
      return { data: null, error: error.message };
    }
  }
  
  /**
   * Verifica se um item está na lista
   */
  export async function isInList(
    itemId: string,
    listType: 'watchlist' | 'favorites'
  ): Promise<boolean> {
    try {
      // Importante: Não precisamos passar o user_id manualmente se o RLS estiver ativo,
      // mas se passar, o tipo deve bater. O erro 400 geralmente é aqui.
      const { data, error } = await supabase
        .from('my_lists')
        .select('item_id')
        .eq('item_id', itemId)
        .eq('list_type', listType)
        .maybeSingle(); // Usar maybeSingle é mais limpo que limit(1)
        
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar item na lista:', error);
      return false;
    }
  }