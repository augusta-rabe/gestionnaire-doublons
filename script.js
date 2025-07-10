
let originalData = [];
let cleanedData = [];
let duplicates = {};
let duplicateStates = {}; // Pour gérer l'état de validation/annulation
let currentFile = null;
let fileType = '';

// Gestion du drag & drop
const uploadSection = document.getElementById('uploadSection');
const fileInput = document.getElementById('fileInput');

uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('dragover');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('dragover');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    currentFile = file;
    fileType = file.name.split('.').pop().toLowerCase();
    
    // Afficher les infos du fichier
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileType').textContent = fileType.toUpperCase();
    document.getElementById('fileInfo').style.display = 'block';
    
    // Analyser le fichier
    analyzeFile(file);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeFile(file) {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('analysisSection').style.display = 'none';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        
        switch(fileType) {
            case 'txt':
            case 'sql':
                processTxtFile(content);
                break;
            case 'csv':
                processCsvFile(content);
                break;
            case 'xlsx':
            case 'xls':
                processExcelFile(content);
                break;
            case 'docx':
                processWordFile(content);
                break;
            default:
                alert('Type de fichier non supporté');
                return;
        }
    };
    
    if (fileType === 'xlsx' || fileType === 'xls') {
        reader.readAsArrayBuffer(file);
    } else if (fileType === 'docx') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function processTxtFile(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    originalData = lines;
    findDuplicates(lines);
    displayResults();
}

function processCsvFile(content) {
    Papa.parse(content, {
        complete: function(results) {
            const allValues = [];
            results.data.forEach(row => {
                row.forEach(cell => {
                    if (cell && cell.trim() !== '') {
                        allValues.push(cell.trim());
                    }
                });
            });
            originalData = allValues;
            findDuplicates(allValues);
            displayResults();
        },
        skipEmptyLines: true
    });
}

function processExcelFile(content) {
    const workbook = XLSX.read(content, { type: 'array' });
    const allValues = [];
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        data.forEach(row => {
            row.forEach(cell => {
                if (cell !== undefined && cell !== null && cell.toString().trim() !== '') {
                    allValues.push(cell.toString().trim());
                }
            });
        });
    });
    
    originalData = allValues;
    findDuplicates(allValues);
    displayResults();
}

function processWordFile(content) {
    mammoth.extractRawText({arrayBuffer: content})
        .then(function(result) {
            const text = result.value;
            const words = text.split(/\s+/).filter(word => word.trim() !== '');
            originalData = words;
            findDuplicates(words);
            displayResults();
        })
        .catch(function(error) {
            console.error('Erreur lors de la lecture du fichier Word:', error);
            alert('Erreur lors de la lecture du fichier Word');
        });
}

function findDuplicates(data) {
    const counts = {};
    duplicates = {};
    duplicateStates = {};
    
    // Compter les occurrences
    data.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });
    
    // Identifier les doublons
    Object.keys(counts).forEach(key => {
        if (counts[key] > 1) {
            duplicates[key] = counts[key];
            duplicateStates[key] = 'active'; // Par défaut, tous les doublons sont actifs
        }
    });
    
    // Créer les données nettoyées initiales
    updateCleanedData();
}

function updateCleanedData() {
    // Créer les données nettoyées en fonction des états des doublons
    const itemCounts = {};
    
    // Compter tous les éléments
    originalData.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
    
    cleanedData = [];
    const processedItems = new Set();
    
    originalData.forEach(item => {
        if (!processedItems.has(item)) {
            processedItems.add(item);
            
            // Si c'est un doublon et qu'il est validé (actif), on ne garde qu'une occurrence
            if (duplicates[item] && duplicateStates[item] === 'active') {
                cleanedData.push(item);
            }
            // Si c'est un doublon annulé, on garde toutes les occurrences
            else if (duplicates[item] && duplicateStates[item] === 'cancelled') {
                for (let i = 0; i < itemCounts[item]; i++) {
                    cleanedData.push(item);
                }
            }
            // Si ce n'est pas un doublon, on le garde
            else if (!duplicates[item]) {
                cleanedData.push(item);
            }
        }
    });
}

function updateDuplicateStats() {
    const activeDuplicates = Object.keys(duplicateStates).filter(key => duplicateStates[key] === 'active').length;
    const cancelledDuplicates = Object.keys(duplicateStates).filter(key => duplicateStates[key] === 'cancelled').length;
    
    document.getElementById('activeDuplicatesCount').textContent = `${activeDuplicates} à supprimer`;
    document.getElementById('cancelledDuplicatesCount').textContent = `${cancelledDuplicates} annulés`;
    
    // Mettre à jour les statistiques principales
    const totalDuplicateItems = Object.keys(duplicateStates).reduce((sum, key) => {
        return sum + (duplicateStates[key] === 'active' ? (duplicates[key] - 1) : 0);
    }, 0);
    
    document.getElementById('duplicateItems').textContent = totalDuplicateItems;
    document.getElementById('uniqueItems').textContent = originalData.length - totalDuplicateItems;
}
function displayResults() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('analysisSection').style.display = 'block';
    
    // Mettre à jour les statistiques
    document.getElementById('totalItems').textContent = originalData.length;
    document.getElementById('duplicateGroups').textContent = Object.keys(duplicates).length;
    
    updateDuplicateStats();
    
    // Afficher les doublons
    const duplicatesList = document.getElementById('duplicatesList');
    duplicatesList.innerHTML = '';
    
    if (Object.keys(duplicates).length === 0) {
        duplicatesList.innerHTML = '<p style="text-align: center; color: #28a745; font-weight: bold;">🎉 Aucun doublon détecté !</p>';
    } else {
        Object.entries(duplicates).forEach(([value, count]) => {
            const item = document.createElement('div');
            item.className = `duplicate-item ${duplicateStates[value] === 'cancelled' ? 'cancelled' : ''}`;
            item.id = `duplicate-${btoa(value).replace(/[^a-zA-Z0-9]/g, '')}`; // ID sécurisé
            
            item.innerHTML = `
                <span class="duplicate-value">${value}</span>
                <div class="duplicate-actions">
                    <span class="duplicate-count ${duplicateStates[value] === 'cancelled' ? 'cancelled' : ''}">${count} fois</span>
                    <button class="btn-small ${duplicateStates[value] === 'active' ? 'btn-cancel' : 'btn-validate'}" 
                            onclick="toggleDuplicateState('${value.replace(/'/g, "\\'")}')">
                        ${duplicateStates[value] === 'active' ? '❌ Annuler' : '✅ Valider'}
                    </button>
                </div>
            `;
            duplicatesList.appendChild(item);
        });
    }
}

function toggleDuplicateState(value) {
    if (duplicateStates[value] === 'active') {
        duplicateStates[value] = 'cancelled';
    } else {
        duplicateStates[value] = 'active';
    }
    
    updateCleanedData();
    updateDuplicateStats();
    
    // Mettre à jour l'affichage de cet élément
    const itemId = `duplicate-${btoa(value).replace(/[^a-zA-Z0-9]/g, '')}`;
    const item = document.getElementById(itemId);
    
    if (item) {
        item.className = `duplicate-item ${duplicateStates[value] === 'cancelled' ? 'cancelled' : ''}`;
        const countSpan = item.querySelector('.duplicate-count');
        const button = item.querySelector('.btn-small');
        
        if (duplicateStates[value] === 'cancelled') {
            countSpan.className = 'duplicate-count cancelled';
            button.className = 'btn-small btn-validate';
            button.textContent = '✅ Valider';
        } else {
            countSpan.className = 'duplicate-count';
            button.className = 'btn-small btn-cancel';
            button.textContent = '❌ Annuler';
        }
    }
}

function validateAllDuplicates() {
    Object.keys(duplicateStates).forEach(key => {
        duplicateStates[key] = 'active';
    });
    
    updateCleanedData();
    displayResults();
}

function cancelAllDuplicates() {
    Object.keys(duplicateStates).forEach(key => {
        duplicateStates[key] = 'cancelled';
    });
    
    updateCleanedData();
    displayResults();
}

function removeAllDuplicates() {
    const activeDuplicates = Object.keys(duplicateStates).filter(key => duplicateStates[key] === 'active');
    
    if (activeDuplicates.length === 0) {
        alert('Aucun doublon validé à supprimer !');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${activeDuplicates.length} groupe(s) de doublons validés ? Cette action ne peut pas être annulée.`)) {
        // Marquer tous les doublons actifs comme supprimés
        activeDuplicates.forEach(key => {
            delete duplicates[key];
            delete duplicateStates[key];
        });
        
        updateCleanedData();
        displayResults();
        
        alert('Doublons validés supprimés avec succès !');
    }
}

function downloadCleanedFile() {
    if (cleanedData.length === 0) {
        alert('Aucune donnée à télécharger !');
        return;
    }
    
    let content = '';
    let fileName = '';
    let mimeType = '';
    
    switch(fileType) {
        case 'txt':
        case 'sql':
            content = cleanedData.join('\n');
            fileName = `cleaned_${currentFile.name}`;
            mimeType = 'text/plain';
            break;
        case 'csv':
            content = cleanedData.join('\n');
            fileName = `cleaned_${currentFile.name}`;
            mimeType = 'text/csv';
            break;
        default:
            content = cleanedData.join('\n');
            fileName = `cleaned_${currentFile.name.split('.')[0]}.txt`;
            mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    
    if (previewSection.style.display === 'none') {
        previewSection.style.display = 'block';
        previewContent.textContent = cleanedData.slice(0, 100).join('\n');
        if (cleanedData.length > 100) {
            previewContent.textContent += '\n... (' + (cleanedData.length - 100) + ' lignes supplémentaires)';
        }
    } else {
        previewSection.style.display = 'none';
    }
}