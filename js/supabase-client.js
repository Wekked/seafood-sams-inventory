// ════════════════════════════════════════════════════════════════
// Supabase Client — Seafood Sam's Inventory Tracker
// ════════════════════════════════════════════════════════════════
//
// SETUP: Replace these with your actual Supabase project values.
//        Find them at: Supabase Dashboard → Settings → API
//
var SUPABASE_URL = 'https://mihsoeydazkqhcwftnsl.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_hDVT8rvLMijlyPxi_8Ywag_AF7GIW2T';

// Initialize client (loaded from CDN in index.html)
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ──── Auth Functions ────

var SupaAuth = {
  // Sign in with email/password
  signIn: function(email, password) {
    return supabase.auth.signInWithPassword({ email: email, password: password });
  },

  // Sign out
  signOut: function() {
    return supabase.auth.signOut();
  },

  // Get current session
  getSession: function() {
    return supabase.auth.getSession();
  },

  // Listen for auth changes (login, logout, token refresh)
  onAuthChange: function(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Get the user's profile (display name, role) from the profiles table
  getProfile: function(userId) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  }
};


// ──── Inventory CRUD Functions ────

var SupaDB = {

  // ──── LOAD ALL ITEMS ────
  // Fetches the full inventory. Called on app boot.
  loadItems: function() {
    return supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true });
  },

  // ──── SAVE QUANTITY CHANGES (batch) ────
  // Called when user clicks "Save All Changes" in the track view.
  // changes = { itemId: newQuantity, itemId: newQuantity, ... }
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

    // Supabase upsert updates existing rows matched by primary key
    return supabase
      .from('items')
      .upsert(updates, { onConflict: 'id' });
  },

  // ──── ADD NEW ITEM ────
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

  // ──── UPDATE ITEM (full edit) ────
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

  // ──── DELETE ITEM ────
  deleteItem: function(id) {
    return supabase
      .from('items')
      .delete()
      .eq('id', id);
  },

  // ──── CLOSE INVENTORY PERIOD ────
  // Sets last_counted to today for all items
  closeInventory: function() {
    var now = new Date().toISOString().split('T')[0];
    return supabase
      .from('items')
      .update({ last_counted: now })
      .neq('id', 0);   // matches all rows (no row has id=0)
  },

  // ──── CUSTOM SORT ORDERS ────
  // Load all saved location orders
  loadCustomOrders: function() {
    return supabase
      .from('location_sort_orders')
      .select('*');
  },

  // Save a custom order for a specific location
  saveCustomOrder: function(location, itemIds) {
    return supabase
      .from('location_sort_orders')
      .upsert(
        { location_name: location, item_order: itemIds },
        { onConflict: 'location_name' }
      );
  },

  // Delete a custom order for a location (reset to default)
  deleteCustomOrder: function(location) {
    return supabase
      .from('location_sort_orders')
      .delete()
      .eq('location_name', location);
  },

  // ──── REALTIME SUBSCRIPTION ────
  // Subscribe to item changes so multiple devices stay in sync
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
// Supabase uses snake_case, our app uses camelCase
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
