// Migration script: Move data from legacy to enhanced storage
const legacyData = {
  "projects": [
    {
      "id": "project-1764609692708",
      "name": "Onius",
      "color": "#10B981",
      "startMonth": 0,
      "startYear": 2025,
      "endMonth": 5,
      "endYear": 2026,
      "allocationMode": "days",
      "positions": [
        {"id": "pos-project-1764609692708-pos-1764609696862-12", "projectId": "project-1764609692708", "monthIndex": 12, "percentage": 21.73913043478261, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-13", "projectId": "project-1764609692708", "monthIndex": 13, "percentage": 25, "allocated": 25, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-14", "projectId": "project-1764609692708", "monthIndex": 14, "percentage": 23.809523809523807, "allocated": 23.809523809523807, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-15", "projectId": "project-1764609692708", "monthIndex": 15, "percentage": 22.727272727272727, "allocated": 22.727272727272727, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-16", "projectId": "project-1764609692708", "monthIndex": 16, "percentage": 22.727272727272727, "allocated": 22.727272727272727, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-17", "projectId": "project-1764609692708", "monthIndex": 17, "percentage": 23.809523809523807, "allocated": 23.809523809523807, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-18", "projectId": "project-1764609692708", "monthIndex": 18, "percentage": 21.73913043478261, "allocated": 21.73913043478261, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-19", "projectId": "project-1764609692708", "monthIndex": 19, "percentage": 23.809523809523807, "allocated": 23.809523809523807, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-20", "projectId": "project-1764609692708", "monthIndex": 20, "percentage": 22.727272727272727, "allocated": 22.727272727272727, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-21", "projectId": "project-1764609692708", "monthIndex": 21, "percentage": 21.73913043478261, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-22", "projectId": "project-1764609692708", "monthIndex": 22, "percentage": 25, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-23", "projectId": "project-1764609692708", "monthIndex": 23, "percentage": 21.73913043478261, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-24", "projectId": "project-1764609692708", "monthIndex": 24, "percentage": 22.727272727272727, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-25", "projectId": "project-1764609692708", "monthIndex": 25, "percentage": 25, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-26", "projectId": "project-1764609692708", "monthIndex": 26, "percentage": 22.727272727272727, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-27", "projectId": "project-1764609692708", "monthIndex": 27, "percentage": 22.727272727272727, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-28", "projectId": "project-1764609692708", "monthIndex": 28, "percentage": 23.809523809523807, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5},
        {"id": "pos-project-1764609692708-pos-1764609696862-29", "projectId": "project-1764609692708", "monthIndex": 29, "percentage": 22.727272727272727, "allocated": 0, "name": "OM", "projectTask": "01O", "days": 5}
      ]
    }
  ],
  "users": [],
  "allocations": [],
  "positions": [],
  "entities": [
    {"id": "1764606513285", "name": "UK", "currencyCode": "GBP", "taxAccount": "500", "ssAccount": "501"}
  ],
  "startMonth": 0,
  "startYear": 2025,
  "expenses": [],
  "scheduledRecords": [],
  "systemUsers": [
    {"id": "1764534755765", "name": "Admin", "email": "admin@sola.com", "password": "admin123", "role": "admin", "isActive": true, "createdAt": "2025-11-30T20:32:35.765Z"},
    {"id": "1764535012318", "name": "Editor", "email": "editor@sola.com", "password": "editor", "role": "editor", "isActive": true, "createdAt": "2025-11-30T20:36:52.318Z"}
  ]
};

fetch('http://localhost:3000/api/azure/enhanced/main', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(legacyData)
})
.then(response => response.json())
.then(data => console.log('Migration successful:', data))
.catch(error => console.error('Migration failed:', error));
