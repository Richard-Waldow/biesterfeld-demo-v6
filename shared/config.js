// White-label config for Biesterfeld Plastic. Both site versions read this file.
// Sources carry their own icon: a brand logo (Simple Icons SVG, tinted with `color`) or a Phosphor glyph (`ph`).
window.CLIENT = {
  name: 'Biesterfeld Plastic',
  unit: 'kg', // quantities are kg internally and shown in tonnes
  demandSources: [
    { id: 'crm', name: 'Biesterfeld CRM', logo: 'biesterfeld', color: '#cb3f1d', take: r => r.channel === 'crm' },
    { id: 'email', name: 'Outlook', ph: 'microsoft-outlook-logo', color: '#0A64AD', take: r => r.channel === 'email' },
    { id: 'whatsapp', name: 'WhatsApp', logo: 'whatsapp', color: '#25D366', take: r => r.channel === 'whatsapp' },
    { id: 'calls', name: 'Calls', ph: 'phone-call', color: '#cb3f1d', take: r => r.channel === 'calls' },
  ],
  supplySources: [
    { id: 'erp', name: 'SAP', logo: 'sap', color: '#0FAAFF', take: r => r.channel === 'erp' },
    { id: 'producer', name: 'Producer EDI', ph: 'factory', color: '#58585a', take: r => r.channel === 'producer' },
    { id: 'ship', name: 'Shipping ETA', ph: 'boat', color: '#1d76a0', take: r => r.channel === 'ship' },
  ],
  // the logo row in "Start"
  integrations: [
    { name: 'Biesterfeld CRM', logo: 'biesterfeld', color: '#cb3f1d' }, { name: 'HubSpot', logo: 'hubspot', color: '#FF7A59' },
    { name: 'SAP', logo: 'sap', color: '#0FAAFF' }, { name: 'Outlook', ph: 'microsoft-outlook-logo', color: '#0A64AD' },
    { name: 'Gmail', logo: 'gmail', color: '#EA4335' }, { name: 'WhatsApp', logo: 'whatsapp', color: '#25D366' },
    { name: 'Teams', ph: 'microsoft-teams-logo', color: '#5B5FC7' }, { name: 'Excel', ph: 'microsoft-excel-logo', color: '#107C41' },
  ],
};
