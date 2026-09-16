export const SAP_VBS_SCRIPT_CONTENT = `' =========================================================================
' SCRIPT SAP GUI (.VBS): EXTRACCIÓN AUTOMÁTICA DE STOCK LX02
' CIAL Alimentos - Centro de Distribución San Jorge
' Reemplazo standalone de la macro Excel LX02_Solo_Descargar_Abrir
' =========================================================================
Option Explicit

' --- CONFIGURACIÓN PRINCIPAL ---
Dim NOMBRE_ARCHIVO_BASE, CENTRO_ALMACEN, VARIANTE_ALV, TIMEOUT_SEGUNDOS
NOMBRE_ARCHIVO_BASE = "LX02_Almacenamiento.xlsx"
CENTRO_ALMACEN      = "NCD"
VARIANTE_ALV        = "/JESTAY"
TIMEOUT_SEGUNDOS    = 45

' --- OBJETOS DE SISTEMA ---
Dim oShell, fso, strDesktop, strUserDocs, strSapDocs
Dim NombreArchivo, rutaDescarga, rutaDocSap
Dim tiempoInicio, archivoEncontrado

Set oShell = CreateObject("WScript.Shell")
Set fso    = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta del Escritorio del usuario actual de Windows
strDesktop = oShell.SpecialFolders("Desktop")
If Right(strDesktop, 1) <> "\\" Then strDesktop = strDesktop & "\\"

' Ruta alternativa usual de exportaciones SAP GUI
strUserDocs = oShell.SpecialFolders("MyDocuments")
If Right(strUserDocs, 1) <> "\\" Then strUserDocs = strUserDocs & "\\"
strSapDocs  = strUserDocs & "SAP\\SAP GUI\\"

NombreArchivo = NOMBRE_ARCHIVO_BASE
rutaDescarga  = strDesktop & NombreArchivo

' 1. Si el archivo ya existe en el Escritorio, intentar eliminarlo previamente.
' Si está abierto y bloqueado en Excel, generar un nombre con timestamp para no fallar.
If fso.FileExists(rutaDescarga) Then
    On Error Resume Next
    fso.DeleteFile rutaDescarga, True
    If Err.Number <> 0 Then
        Err.Clear
        Dim timestamp
        timestamp = Year(Now) & _
                    Right("0" & Month(Now), 2) & _
                    Right("0" & Day(Now), 2) & "_" & _
                    Right("0" & Hour(Now), 2) & _
                    Right("0" & Minute(Now), 2) & _
                    Right("0" & Second(Now), 2)
        NombreArchivo = "LX02_Almacenamiento_" & timestamp & ".xlsx"
        rutaDescarga  = strDesktop & NombreArchivo
    End If
    On Error GoTo 0
End If

' Borrar también de la carpeta temporal de SAP si existiera
If fso.FolderExists(strSapDocs) Then
    If fso.FileExists(strSapDocs & NombreArchivo) Then
        On Error Resume Next
        fso.DeleteFile strSapDocs & NombreArchivo, True
        On Error GoTo 0
    End If
End If

' 2. CONEXIÓN A SAP GUI
Dim SapGuiAuto, sapApp, connection, session

On Error Resume Next
Set SapGuiAuto = GetObject("SAPGUI")
If Err.Number <> 0 Or Not IsObject(SapGuiAuto) Then
    MsgBox "No se encontró SAP GUI en ejecución." & vbCrLf & vbCrLf & _
           "Por favor, abre SAP GUI, inicia sesión en el mandante de CIAL y vuelve a ejecutar este script.", _
           vbCritical, "SAP GUI no detectado"
    WScript.Quit 1
End If

Set sapApp = SapGuiAuto.GetScriptingEngine
If Err.Number <> 0 Or Not IsObject(sapApp) Then
    MsgBox "No se pudo acceder al motor de scripting de SAP GUI." & vbCrLf & vbCrLf & _
           "Verifica que el soporte de Scripting esté habilitado en las opciones de SAP GUI." & vbCrLf & _
           "(Opciones > Accesibilidad y scripting > Scripting > Habilitar scripting)", _
           vbCritical, "Scripting SAP Deshabilitado"
    WScript.Quit 1
End If

If sapApp.Children.Count = 0 Then
    MsgBox "No hay ninguna conexión activa abierta en SAP GUI." & vbCrLf & vbCrLf & _
           "Inicia sesión en SAP antes de ejecutar la descarga.", _
           vbExclamation, "Sin conexión SAP activa"
    WScript.Quit 1
End If

Set connection = sapApp.Children(0)
If connection.Children.Count = 0 Then
    MsgBox "No se encontró una sesión activa en la conexión de SAP.", _
           vbExclamation, "Sin sesión SAP"
    WScript.Quit 1
End If

Set session = connection.Children(0)
If session.Busy Then
    MsgBox "La sesión de SAP se encuentra ocupada realizando otra tarea." & vbCrLf & _
           "Por favor espera a que termine y vuelve a ejecutar.", _
           vbExclamation, "Sesión SAP Ocupada"
    WScript.Quit 1
End If
On Error GoTo 0

' 3. EJECUCIÓN DE TRANSACCIÓN LX02
On Error Resume Next

With session
    .findById("wnd[0]").maximize

    ' Ir a Transacción /nLX02
    .findById("wnd[0]/tbar[0]/okcd").Text = "/nLX02"
    .findById("wnd[0]").sendVKey 0
    Call EsperarSincronizacion(session)

    ' Número de Almacén (LGNUM = NCD)
    .findById("wnd[0]/usr/ctxtS1_LGNUM").Text = CENTRO_ALMACEN

    ' Selector múltiple de Tipos de Almacén
    .findById("wnd[0]/usr/btn%_S1_LGTYP_%_APP_%-VALU_PUSH").press
    Call EsperarSincronizacion(session)

    ' Cargar los 4 tipos de almacenamiento solicitados:
    ' [1,0] = PBK (Push Back)
    ' [1,1] = CGO (Congelados)
    ' [1,2] = PFW (Post Forward)
    ' [1,3] = RCK (Producto Crítico / Rack)
    .findById("wnd[1]/usr/tabsTAB_STRIP/tabpSIVA/ssubSCREEN_HEADER:SAPLALDB:3010/tblSAPLALDBSINGLE/ctxtRSCSEL_255-SLOW_I[1,0]").Text = "PBK"
    .findById("wnd[1]/usr/tabsTAB_STRIP/tabpSIVA/ssubSCREEN_HEADER:SAPLALDB:3010/tblSAPLALDBSINGLE/ctxtRSCSEL_255-SLOW_I[1,1]").Text = "CGO"
    .findById("wnd[1]/usr/tabsTAB_STRIP/tabpSIVA/ssubSCREEN_HEADER:SAPLALDB:3010/tblSAPLALDBSINGLE/ctxtRSCSEL_255-SLOW_I[1,2]").Text = "PFW"
    .findById("wnd[1]/usr/tabsTAB_STRIP/tabpSIVA/ssubSCREEN_HEADER:SAPLALDB:3010/tblSAPLALDBSINGLE/ctxtRSCSEL_255-SLOW_I[1,3]").Text = "RCK"

    ' Tomar selección (F8 / btn[8])
    .findById("wnd[1]/tbar[0]/btn[8]").press
    Call EsperarSincronizacion(session)

    ' Variante oficial de visualización
    .findById("wnd[0]/usr/ctxtP_VARI").Text = VARIANTE_ALV

    ' Ejecutar reporte (F8 / btn[8])
    .findById("wnd[0]/tbar[1]/btn[8]").press
    Call EsperarSincronizacion(session)
    WScript.Sleep 2000

    ' Menú Exportar a Hoja de Cálculo (Lista -> Exportar -> Hoja de cálculo...)
    .findById("wnd[0]/mbar/menu[0]/menu[1]/menu[1]").Select
    Call EsperarSincronizacion(session)

    ' Si el diálogo ofrece cambiar directorio, intentar asignar el Escritorio
    .findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/ctxtDY_PATH").Text = strDesktop
    .findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-DIRECTORY").Text = strDesktop

    ' Nombre de archivo
    .findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").Text = NombreArchivo

    ' Botón Generar / Exportar (btn[20])
    .findById("wnd[1]/tbar[0]/btn[20]").press
    Call EsperarSincronizacion(session)

    ' Confirmar cuadro de diálogo (btn[0])
    .findById("wnd[1]/tbar[0]/btn[0]").press
    Call EsperarSincronizacion(session)
End With

If Err.Number <> 0 Then
    MsgBox "Ocurrió un error interactuando con SAP GUI:" & vbCrLf & vbCrLf & _
           "Descripción: " & Err.Description & vbCrLf & _
           "Código: " & Hex(Err.Number), vbCritical, "Error en Ejecución SAP"
    WScript.Quit 1
End If
On Error GoTo 0

' 4. ESPERAR GENERACIÓN DEL ARCHIVO
tiempoInicio = Timer
archivoEncontrado = False

Do While (Timer - tiempoInicio) < TIMEOUT_SEGUNDOS
    ' Verificar si está en el Escritorio
    If fso.FileExists(rutaDescarga) Then
        archivoEncontrado = True
        Exit Do
    End If

    ' Verificar si SAP lo guardó en su carpeta predeterminada (Documents\\SAP\\SAP GUI)
    If fso.FolderExists(strSapDocs) Then
        If fso.FileExists(strSapDocs & NombreArchivo) Then
            On Error Resume Next
            fso.CopyFile strSapDocs & NombreArchivo, rutaDescarga, True
            If fso.FileExists(rutaDescarga) Then
                archivoEncontrado = True
                Exit Do
            End If
            On Error GoTo 0
        End If
    End If

    WScript.Sleep 500
Loop

If Not archivoEncontrado Then
    MsgBox "SAP no generó el archivo dentro de los " & TIMEOUT_SEGUNDOS & " segundos de espera." & vbCrLf & vbCrLf & _
           "Ruta esperada: " & rutaDescarga & vbCrLf & _
           "Revisa si SAP mostró alguna alerta o error de autorización en la transacción LX02.", _
           vbCritical, "Tiempo de espera agotado"
    WScript.Quit 1
End If

' Pausa de 2 segundos para liberar bloqueos de escritura
WScript.Sleep 2000

' 5. ABRIR EL ARCHIVO DESCARGADO EN EXCEL
On Error Resume Next
oShell.Run Chr(34) & rutaDescarga & Chr(34)
On Error GoTo 0

' Mensaje de éxito
MsgBox "¡Descarga de inventario LX02 completada con éxito!" & vbCrLf & vbCrLf & _
       "• Archivo: " & NombreArchivo & vbCrLf & _
       "• Ubicación: " & rutaDescarga & vbCrLf & vbCrLf & _
       "El archivo ya está listo para ser cargado o copiado en https://almacenamiento.nexusnetwork.cl", _
       vbInformation, "SAP LX02 - CIAL Alimentos"

WScript.Quit 0

' --- SUBRUTINAS DE APOYO ---
Sub EsperarSincronizacion(sess)
    On Error Resume Next
    Dim i
    For i = 1 To 150
        If Not sess.Busy Then Exit For
        WScript.Sleep 100
    Next
    On Error GoTo 0
End Sub
`;
