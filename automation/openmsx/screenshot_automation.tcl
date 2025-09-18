# OpenMSX Screenshot Automation Script
# Versión: 1.0
# Propósito: Automatizar captura de screenshots con configuración flexible

# Configuración por defecto (puede ser sobrescrita)
if {![info exists wait_time]} { set wait_time 10 }
if {![info exists screenshot_dir]} { set screenshot_dir "screenshots" }
if {![info exists rom_name]} { set rom_name "unknown_rom" }
if {![info exists auto_exit]} { set auto_exit true }
if {![info exists screenshot_prefix]} { set screenshot_prefix "" }

# Procedimientos auxiliares
proc log_automation {level message} {
    set timestamp [clock format [clock seconds] -format "%Y-%m-%d %H:%M:%S"]
    puts "\[AUTOMATION\] \[$timestamp\] \[$level\] $message"
}

proc ensure_directory {dir_path} {
    if {![file exists $dir_path]} {
        log_automation "INFO" "Creando directorio: $dir_path"
        file mkdir $dir_path
    }
}

proc get_machine_info {} {
    set machine_name "unknown"
    catch {
        set machine_name [machine_info config_name]
    }
    return $machine_name
}

proc capture_screenshot {output_path} {
    log_automation "INFO" "Iniciando captura de screenshot..."

    # Intentar diferentes métodos de captura
    set success false
    set error_msg ""

    # Método 1: Screenshot básico
    if {!$success} {
        if {[catch {screenshot $output_path} result]} {
            set error_msg "Método básico falló: $result"
        } else {
            set success true
            log_automation "SUCCESS" "Screenshot capturado con método básico"
        }
    }

    # Método 2: Screenshot con parámetros específicos
    if {!$success} {
        if {[catch {screenshot -raw $output_path} result]} {
            set error_msg "$error_msg; Método raw falló: $result"
        } else {
            set success true
            log_automation "SUCCESS" "Screenshot capturado con método raw"
        }
    }

    if {!$success} {
        log_automation "ERROR" "Falló la captura de screenshot: $error_msg"
        return false
    }

    # Verificar que el archivo se creó
    if {[file exists $output_path]} {
        set file_size [file size $output_path]
        log_automation "SUCCESS" "Screenshot guardado: $output_path ($file_size bytes)"
        return true
    } else {
        log_automation "ERROR" "El archivo de screenshot no se creó: $output_path"
        return false
    }
}

proc generate_screenshot_filename {} {
    global screenshot_dir rom_name screenshot_prefix

    # Crear timestamp único
    set timestamp [clock format [clock seconds] -format "%Y%m%d_%H%M%S"]
    set milliseconds [expr {[clock clicks -milliseconds] % 1000}]
    set unique_timestamp "${timestamp}_${milliseconds}"

    # Limpiar nombre del ROM (quitar caracteres problemáticos)
    regsub -all {[^a-zA-Z0-9_-]} $rom_name "_" clean_rom_name

    # Construir nombre del archivo
    set filename ""
    if {$screenshot_prefix != ""} {
        set filename "${screenshot_prefix}_"
    }
    set filename "${filename}${clean_rom_name}_${unique_timestamp}.png"

    return [file join $screenshot_dir $filename]
}

proc wait_for_rom_boot {} {
    global wait_time

    log_automation "INFO" "Esperando $wait_time segundos para que el ROM arranque..."

    # Mostrar progreso cada segundo
    for {set i 1} {$i <= $wait_time} {incr i} {
        after 1000
        if {$i % 5 == 0 || $i == $wait_time} {
            log_automation "INFO" "Progreso: $i/$wait_time segundos"
        }
    }

    log_automation "INFO" "Tiempo de espera completado"
}

proc get_emulation_info {} {
    set info_list {}

    # Información de la máquina
    catch {
        lappend info_list "Máquina: [get_machine_info]"
    }

    # Estado del sistema
    catch {
        set cpu_time [debug read "CPU time"]
        lappend info_list "CPU time: $cpu_time"
    }

    # Información de video
    catch {
        set vdp_mode [debug read "VDP status reg 2"]
        lappend info_list "VDP status: $vdp_mode"
    }

    return $info_list
}

proc automation_main {} {
    global rom_name screenshot_dir auto_exit

    log_automation "INFO" "=== OpenMSX Screenshot Automation ==="
    log_automation "INFO" "ROM: $rom_name"
    log_automation "INFO" "Directorio de salida: $screenshot_dir"
    log_automation "INFO" "Auto-exit: $auto_exit"

    # Información del sistema
    set sys_info [get_emulation_info]
    foreach info $sys_info {
        log_automation "INFO" $info
    }

    # Asegurar que existe el directorio
    ensure_directory $screenshot_dir

    # Esperar tiempo de arranque
    wait_for_rom_boot

    # Generar nombre de archivo
    set screenshot_file [generate_screenshot_filename]
    log_automation "INFO" "Archivo de salida: $screenshot_file"

    # Capturar screenshot
    set capture_success [capture_screenshot $screenshot_file]

    if {$capture_success} {
        log_automation "SUCCESS" "Screenshot automation completada exitosamente"

        # Información adicional del archivo creado
        if {[file exists $screenshot_file]} {
            set file_info [file stat $screenshot_file stat_array]
            set mod_time [clock format $stat_array(mtime) -format "%Y-%m-%d %H:%M:%S"]
            log_automation "INFO" "Archivo creado: $mod_time"
        }
    } else {
        log_automation "ERROR" "Screenshot automation falló"
    }

    # Salir automáticamente si está configurado
    if {$auto_exit} {
        log_automation "INFO" "Cerrando OpenMSX en 3 segundos..."
        after 3000 {
            log_automation "INFO" "Saliendo de OpenMSX"
            exit
        }
    } else {
        log_automation "INFO" "Automation completada. OpenMSX permanece abierto."
    }
}

# Ejecutar automatización principal
log_automation "INFO" "Iniciando script de automatización..."
automation_main