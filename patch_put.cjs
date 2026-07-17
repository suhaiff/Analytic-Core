const fs = require('fs');
const p = 'server/AnalyticCore-Server/daxRoutes.js';
let d = fs.readFileSync(p, 'utf8');

const replacement = `// Update an existing custom measure
router.put('/measure/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dax_formula, sheet_id } = req.body;

        if (!name || !dax_formula) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sql_compiled = daxParserService.parseToSql(dax_formula);

        // In-memory dataset edit bypass
        if (sheet_id && isNaN(parseInt(sheet_id))) {
            return res.status(200).json({
                id: parseInt(id) || id,
                sheet_id: null,
                name,
                dax_formula,
                sql_compiled
            });
        }

        const supabase = getScopedSupabase(req);

        const { data, error } = await supabase
            .from('custom_measures')
            .update({
                name,
                dax_formula,
                sql_compiled
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating measure:', error.message);
        res.status(400).json({ error: error.message || 'Failed to update measure' });
    }
});`;

d = d.replace(/\/\/ Update an existing custom measure[\s\S]*?(?=\nmodule\.exports)/, replacement + '\n');
fs.writeFileSync(p, d);
