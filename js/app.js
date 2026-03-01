// ════════════════════════════════════════════════════════════════
// Supabase Client — Seafood Sam's Inventory Tracker
// ════════════════════════════════════════════════════════════════
//
// SETUP: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your values.
//        Find them at: Supabase Dashboard → Settings → API Keys
//
var SUPABASE_URL = 'https://mihsoeydazkqhcwftnsl.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paHNvZXlkYXprcWhjd2Z0bnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTYyMjQsImV4cCI6MjA4Nzg5MjIyNH0.CGpiRk7lALi3ppAvWxMfyaP8LYVL1GsWtQB_ouEz6co';

// Initialize Supabase client with session persistence
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'seafoodsams-auth'
  }
});

// ──── Auth Functions ────

var SupaAuth = {
  signIn: function(email, password) {
    return supabase.auth.signInWithPassword({ email: email, password: password });
  },

  signOut: function() {
    return supabase.auth.signOut();
  },

  getSession: function() {
    return supabase.auth.getSession();
  },

  onAuthChange: function(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  getProfile: function(userId) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  }
};


// ──── Inventory CRUD Functions ────

var SupaDB = {

  loadItems: function() {
    return supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true });
  },

  saveQuantityChanges: function(changes, items) {
    var now = new Date().toISOString().split('T')[0];
    var updates = Object.keys(changes).map(function(idStr) {
      var id = parseInt(idStr);
      var item = items.find(function(i) { return i.id === id; });
      var newQty = changes[idStr];
      var newValue = Math.round(newQty * (item ? item.price : 0) * 100) / 100;
      return {
        id: id,
        quantity: newQty,
        total_value: newValue,
        last_counted: now
      };
    });

    return supabase
      .from('items')
      .upsert(updates, { onConflict: 'id' });
  },

  addItem: function(item) {
    return supabase
      .from('items')
      .insert({
        item_number:   item.itemNumber,
        name:          item.name,
        category:      item.category,
        location:      item.location,
        quantity:       parseFloat(item.quantity) || 0,
        quantity_unit:  item.quantityUnit,
        price:          parseFloat(item.price) || 0,
        price_unit:     item.priceUnit,
        total_value:    (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
        last_counted:   new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
  },

  updateItem: function(item) {
    var qty = parseFloat(item.quantity) || 0;
    var price = parseFloat(item.price) || 0;
    return supabase
      .from('items')
      .update({
        item_number:   item.itemNumber,
        name:          item.name,
        category:      item.category,
        location:      item.location,
        quantity:       qty,
        quantity_unit:  item.quantityUnit,
        price:          price,
        price_unit:     item.priceUnit,
        total_value:    Math.round(qty * price * 100) / 100
      })
      .eq('id', item.id);
  },

  deleteItem: function(id) {
    return supabase
      .from('items')
      .delete()
      .eq('id', id);
  },

  closeInventory: function() {
    var now = new Date().toISOString().split('T')[0];
    return supabase
      .from('items')
      .update({ last_counted: now })
      .neq('id', 0);
  },

  loadCustomOrders: function() {
    return supabase
      .from('location_sort_orders')
      .select('*');
  },

  saveCustomOrder: function(location, itemIds) {
    return supabase
      .from('location_sort_orders')
      .upsert(
        { location_name: location, item_order: itemIds },
        { onConflict: 'location_name' }
      );
  },

  deleteCustomOrder: function(location) {
    return supabase
      .from('location_sort_orders')
      .delete()
      .eq('location_name', location);
  },

  subscribeToItems: function(onInsert, onUpdate, onDelete) {
    return supabase
      .channel('items-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, function(payload) {
        if (onInsert) onInsert(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, function(payload) {
        if (onUpdate) onUpdate(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, function(payload) {
        if (onDelete) onDelete(payload.old);
      })
      .subscribe();
  },

  unsubscribe: function(channel) {
    supabase.removeChannel(channel);
  }
};

// ──── Helper: Convert DB row → App item format ────
function dbToItem(row) {
  return {
    id:           row.id,
    category:     row.category,
    itemNumber:   row.item_number,
    name:         row.name,
    location:     row.location,
    quantity:      row.quantity,
    quantityUnit: row.quantity_unit,
    price:        row.price,
    priceUnit:    row.price_unit,
    totalValue:   row.total_value,
    lastCounted:  row.last_counted
  };
}

// Make available globally
window.SupaAuth = SupaAuth;
window.SupaDB = SupaDB;
window.dbToItem = dbToItem;
