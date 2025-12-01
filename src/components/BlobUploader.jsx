import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';

export default function BlobUploader() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/json') {
                setFile(selectedFile);
                setError(null);
                setResult(null);
            } else {
                setError('Bitte wählen Sie eine JSON-Datei aus');
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Bitte wählen Sie zuerst eine Datei aus');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            // Read the file
            const fileContent = await file.text();
            const data = JSON.parse(fileContent);

            // Upload to Netlify (credentials: 'include' sends the auth_token cookie)
            const response = await fetch('/.netlify/functions/uploadBlobs', {
                method: 'POST',
                credentials: 'include', // Important: sends cookies
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storeName: 'records',
                    key: 'data',
                    data: data
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: responseData.message,
                    timestamp: responseData.timestamp,
                    recordCount: data.records?.length || 0,
                    checkedCount: data.checked?.length || 0
                });
            } else {
                throw new Error(responseData.error || 'Upload fehlgeschlagen');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Fehler beim Hochladen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <FileJson className="w-8 h-8 text-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Blob-Daten hochladen</h1>
                    </div>

                    <p className="text-slate-300 mb-6">
                        Laden Sie Ihre lokalen Blob-Daten (.netlify/blobs/deploy/records/data.json)
                        wieder auf Netlify hoch.
                    </p>

                    {/* File Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            JSON-Datei auswählen
                        </label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-500 file:text-white
                                hover:file:bg-blue-600
                                file:cursor-pointer cursor-pointer
                                border border-slate-600 rounded-lg
                                bg-slate-700/50"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 
                            disabled:bg-slate-600 disabled:cursor-not-allowed
                            text-white font-semibold py-3 px-6 rounded-lg 
                            transition-all duration-200 transform hover:scale-[1.02]
                            disabled:transform-none shadow-lg"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Wird hochgeladen...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Daten hochladen
                            </>
                        )}
                    </button>

                    {/* Success Message */}
                    {result && result.success && (
                        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-400 mb-1">
                                        Erfolgreich hochgeladen!
                                    </h3>
                                    <p className="text-sm text-green-300 mb-2">{result.message}</p>
                                    <div className="text-xs text-green-400/80 space-y-1">
                                        <p>• Datensätze: {result.recordCount}</p>
                                        <p>• Geprüfte: {result.checkedCount}</p>
                                        <p>• Zeitstempel: {new Date(result.timestamp).toLocaleString('de-DE')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-400 mb-1">Fehler</h3>
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                        <h3 className="font-semibold text-slate-300 mb-2">Anleitung:</h3>
                        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                            <li>Wählen Sie die lokale data.json Datei aus</li>
                            <li>Klicken Sie auf "Daten hochladen"</li>
                            <li>Die Daten werden zu Netlify Blobs hochgeladen</li>
                            <li>Nach erfolgreicher Upload können Sie die Seite neu laden</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
