const express = require('express');
const cors = require('cors');
const { supabase, supabaseUrl } = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'HRMS Express Backend API',
    status: 'online',
    supabase_url: supabaseUrl
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { count, error } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.json({
      backend: 'healthy',
      database: { status: 'connected', companies_count: count },
      supabase_url: supabaseUrl
    });
  } catch (err) {
    res.status(500).json({
      backend: 'healthy',
      database: { status: 'error', message: err.message },
      supabase_url: supabaseUrl
    });
  }
});

// Companies
app.get('/api/companies', async (req, res) => {
  const { data, error } = await supabase.from('companies').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Employees
app.get('/api/employees', async (req, res) => {
  const { company_id } = req.query;
  let query = supabase.from('employees').select('*');
  if (company_id) query = query.eq('company_id', company_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/employees', async (req, res) => {
  try {
    const { company_id, first_name, last_name, email, role, department, designation, date_of_joining } = req.body;
    
    // Fetch company code
    const { data: compData } = await supabase.from('companies').select('company_code').eq('id', company_id).single();
    const compCode = compData ? compData.company_code : '01';

    // Get max serial
    const { data: empData } = await supabase.from('employees').select('serial_of_joining').eq('company_id', company_id);
    const existingSerials = empData ? empData.map(e => e.serial_of_joining) : [];
    const serial = existingSerials.length > 0 ? Math.max(...existingSerials) + 1 : 1;

    const joiningYear = new Date(date_of_joining).getFullYear();
    const fnCode = first_name.substring(0, 2).toUpperCase();
    const lnCode = last_name.substring(0, 2).toUpperCase();
    const login_id = `${compCode}${fnCode}${lnCode}${joiningYear}${String(serial).padStart(4, '0')}`;

    const { data, error } = await supabase.from('employees').insert([{
      ...req.body,
      serial_of_joining: serial,
      login_id
    }]).select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Attendance Records
app.get('/api/attendance', async (req, res) => {
  const { company_id, work_date } = req.query;
  let query = supabase.from('attendance_records').select('*, employees(first_name, last_name, login_id)');
  if (company_id) query = query.eq('company_id', company_id);
  if (work_date) query = query.eq('work_date', work_date);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Time Off Requests
app.get('/api/timeoff/requests', async (req, res) => {
  const { employee_id, status } = req.query;
  let query = supabase.from('time_off_requests').select('*, employees(first_name, last_name, login_id)');
  if (employee_id) query = query.eq('employee_id', employee_id);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`HRMS Express Server running on port ${PORT}`);
});
