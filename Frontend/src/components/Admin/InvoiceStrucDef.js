// components/Admin/InvoiceStrucDef.js
import React, { useState, useEffect } from 'react';
import {
  isTableSaved as initialSaveStatus,
  tableConfig as initialFields,
  isTableGenerated
} from './table.config';

const fieldTypes = ['text', 'number', 'date'];

const InvoiceStrucDef = ({ setTableConfig, setTableConfigGenerated }) => {
  const [fields, setFields] = useState(initialFields || []);
  const [showDialog, setShowDialog] = useState(false);
  const [canSave, setCanSave] = useState(!initialSaveStatus); // flipped
  const [canGenerate, setCanGenerate] = useState(initialSaveStatus && isTableGenerated);

  useEffect(() => {
    const savedConfig = localStorage.getItem("invoice_table_config");
    const isGenerated = localStorage.getItem("table_config_generated") === "true";

    if (savedConfig) {
      setFields(JSON.parse(savedConfig));
      setCanGenerate(isGenerated);
      setCanSave(!isGenerated);
    }
  }, []);
const handleAddField = () => {
  setFields([
    ...fields,
    { section: 'Others', name: '', type: 'text', required: false, options: '' }
  ]);
  setCanSave(true);
  setCanGenerate(false);
};

  const handleRemoveField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
    setCanSave(true);
    setCanGenerate(false);
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
    setCanSave(true);
    setCanGenerate(false);
  };

  const handleSaveSchema = () => {
    const schemaJSON = fields.reduce((acc, field) => {
  acc[field.name] = {
    type: field.type,
    required: field.required,
    section: field.section
  };
  return acc;
}, {});
  

    console.log("\n🧾 JSON Config:", JSON.stringify(schemaJSON, null, 2));

    let modelCode = `from django.db import models\n\nclass CustomInvoice(models.Model):`;
    fields.forEach(field => {
      const fname = field.name.replace(/\s+/g, '_').toLowerCase();
      let ftype = 'models.CharField(max_length=255)';
      if (field.type === 'number') ftype = 'models.FloatField()';
      if (field.type === 'date') ftype = 'models.DateField()';
      if (!field.required) ftype = ftype.replace(')', ', blank=True, null=True)');
      modelCode += `\n    ${fname} = ${ftype}`;
    });

    console.log("\n🧩 Django Model:\n" + modelCode);

    localStorage.setItem("invoice_table_config", JSON.stringify(fields));
    localStorage.setItem("table_config_generated", "false");
    setCanSave(false);
    setCanGenerate(true);
  };

  const handleGenerateTable = () => setShowDialog(true);
  const cancelGenerate = () => setShowDialog(false);

  const confirmGenerate = () => {
    const config = fields.reduce((acc, field) => {
      acc[field.name] = {
        type: field.type,
        required: field.required,
        ...(field.type === 'dropdown' && { options: field.options.split(',').map(opt => opt.trim()) })
      };
      return acc;
    }, {});
    setTableConfig(config);
    setTableConfigGenerated(true);
    localStorage.setItem("table_config_generated", "true");
    setShowDialog(false);
  };

  const handleReset = () => {
    localStorage.removeItem("invoice_table_config");
    localStorage.removeItem("table_config_generated");
    window.location.reload(); // clean restart
  };


  return (
    <div className="invoice-struct-def">
      <h2>Define Invoice Table Structure</h2>
{[...new Set(fields.map(f => f.section))].map((section, i) => (
  <div key={i} className="section-block">
    <h3>{section}</h3>

    {fields
      .map((field, idx) => ({ ...field, index: idx }))
      .filter(field => field.section === section)
      .map(field => (
        <div className="field-row" key={field.index}>
          <input
            type="text"
            placeholder="Field Name"
            value={field.name}
            onChange={(e) => handleFieldChange(field.index, 'name', e.target.value)}
          />
          <select
            value={field.type}
            onChange={(e) => handleFieldChange(field.index, 'type', e.target.value)}
          >
            {fieldTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {field.type === 'dropdown' && (
            <input
              type="text"
              placeholder="Option1, Option2, Option3"
              value={field.options || ''}
              onChange={(e) => handleFieldChange(field.index, 'options', e.target.value)}
              className="options-input"
            />
          )}
          <label className="checkbox-wrap">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => handleFieldChange(field.index, 'required', e.target.checked)}
            />
            Required
          </label>
          <button className="delete-btn" onClick={() => handleRemoveField(field.index)}>✖</button>
        </div>
      ))}

    {/* Add Field Button for Section */}
  {section !== 'Others' && (
  <button className="add-section-field-btn" onClick={() => {
    setFields([
      ...fields,
      { section, name: '', type: 'text', required: false, options: '' }
    ]);
    setCanSave(true);
    setCanGenerate(false);
  }}>
    ➕ Add Field to {section}
  </button>
)}

  </div>
))}


     <div>
  <button className="add-btn" onClick={handleAddField}>+ Add Other Fields</button>
  <button className="save-btn" onClick={handleSaveSchema} disabled={!canSave}>
    Save Structure
  </button>
</div>
  <button className="generate-btn" onClick={handleGenerateTable} disabled={!canGenerate}>
    Generate Table
  </button>
   <button className="reset-btn" onClick={handleReset}>Reset</button>

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <p>This is a one-time process. Are you sure this is the final structure?</p>
            <div className="dialog-actions">
              <button onClick={confirmGenerate}>Yes</button>
              <button onClick={cancelGenerate}>No</button>
            </div>
          </div>
        </div>
      )}
    <style>{`
        .invoice-struct-def {
          padding: 24px;
          background: #ffffff;
          border-radius: 10px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.08);
          max-width: 800px;
          margin: 20px auto;
        }
        .invoice-struct-def h2 {
          margin-bottom: 20px;
          color: #2c3e50;
        }
        .field-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .field-row input[type="text"],
        .field-row select {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
          min-width: 160px;
        }
        .options-input {
          flex: 1;
          min-width: 220px;
        }
        .checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .add-btn, .save-btn, .generate-btn {
          background: #2c3e50;
          color: white;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          margin-right: 10px;
          margin-top: 10px;
          cursor: pointer;
        }
        .generate-btn {
          background: #27ae60;
        }
        .generate-btn:hover {
          background: #219150;
        }
        .add-btn:hover, .save-btn:hover {
          background: #1a252f;
        }
        .save-btn:disabled,
.generate-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

        .delete-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .delete-btn:hover {
          background: #c0392b;
        }
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dialog-box {
          background: white;
          padding: 24px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .dialog-actions button {
          margin: 0 10px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
          .reset-btn {
  background:rgb(209, 59, 17);
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  margin-left: 10px;
  cursor: pointer;
}

.reset-btn:hover {
  background:rgb(187, 12, 12);
}

.section-block {
  background: #ffffff;
  padding: 20px;
  margin-bottom: 32px;
  border-radius: 8px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.06); /* soft elevation */
  transition: box-shadow 0.2s ease;
}

.section-block:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1); /* subtle lift on hover */
}

.section-block h3 {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 12px;
}


      `}</style>
    </div>
  );
};

export default InvoiceStrucDef;



     