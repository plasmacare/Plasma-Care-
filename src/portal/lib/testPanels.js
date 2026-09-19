import { supabase } from '../../lib/supabase'

function fromRow(row) {
  return {
    id: row.id,
    category: row.category,
    testName: row.test_name,
    panelHeading: row.panel_heading,
    parameters: row.parameters || [],
    notes: row.notes,
  }
}

/** All test panels (test → its parameter list with unit/reference), for the Generate Report search. */
export async function listTestPanels() {
  const { data, error } = await supabase.from('test_panels').select('*').order('test_name')
  if (error) throw error
  return (data || []).map(fromRow)
}

/** Updates a panel's parameter list (e.g. after an admin fixes an auto-extracted reference range). */
export async function updateTestPanelParameters(id, parameters) {
  const { error } = await supabase
    .from('test_panels')
    .update({ parameters, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
