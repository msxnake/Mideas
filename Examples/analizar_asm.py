import re
import sys
import os

class Z80FlowAnalyzer:
    def __init__(self, filepath):
        self.filepath = filepath
        self.lines = []
        self.labels = {}  # Mapa de {nombre_etiqueta: numero_linea}
        self.visited_stack = [] # Para evitar recursión infinita en el análisis
        self.max_steps = 4000    # Límite duro de pasos para evitar bucles largos
        self.total_steps = 0
        
        # Diccionario básico de BIOS MSX para dar contexto
        self.msx_bios = {
            "0000": "RST 0 (Reinicia)",
            "0005": "BDOS (System Call)",
            "0047": "WRTVDP (Escribe en registro VDP)",
            "005C": "FILVRM (Llena VRAM)",
            "005F": "LDIRVM (Block transfer a VRAM)",
            "00D5": "CHGMOD (Cambia modo de pantalla)",
            "00D8": "INITXT (Modo Texto 40x24)",
            "00C3": "CLS (Borrar pantalla)",
            "009F": "CHGET (Esperar tecla)",
            "013E": "KILBUF (Borrar buffer teclado)",
            "00A2": "SNSMAT (Leer matriz teclado)",
            "00D2": "BEEP (Pitido)",
        }

    def load_file(self):
        """Carga el archivo y limpia comentarios básicos para el parsing inicial"""
        if not os.path.exists(self.filepath):
            print(f"Error: El archivo {self.filepath} no existe.")
            return False

        with open(self.filepath, 'r', encoding='utf-8', errors='ignore') as f:
            raw_lines = f.readlines()

        # Primer pase: Indexar etiquetas
        print(f"--- Analizando {self.filepath} ---\n")
        
        for idx, line in enumerate(raw_lines):
            clean_line = line.strip()
            self.lines.append(clean_line)
            
            # Regex para encontrar etiquetas (ej: "Main:", "INIT_GL:", "Loop")
            # Ignoramos líneas que empiezan con punto y coma (comentarios)
            if not clean_line.startswith(';') and clean_line:
                # Buscar etiqueta al inicio de la linea
                label_match = re.match(r'^([a-zA-Z0-9_]+):?', clean_line)
                if label_match:
                    label_name = label_match.group(1)
                    # Evitar instrucciones que parezcan etiquetas
                    if label_name.upper() not in ['LD', 'CP', 'INC', 'DEC', 'XOR', 'AND', 'OR', 'RET', 'NOP', 'DI', 'EI']:
                        self.labels[label_name] = idx

        return True

    def get_comment(self, line):
        """Extrae el comentario de una línea si existe"""
        parts = line.split(';', 1)
        if len(parts) > 1:
            return parts[1].strip()
        return ""

    def analyze_flow(self, start_label=None):
        """Inicia el recorrido visual"""
        start_index = 0
        
        # Intentar encontrar un punto de partida lógico
        if start_label and start_label in self.labels:
            start_index = self.labels[start_label]
            print(f"🟢 INICIO en etiqueta especificada: {start_label}")
        elif "START" in self.labels:
            start_index = self.labels["START"]
            print(f"🟢 INICIO detectado en etiqueta: START")
        elif "MAIN" in self.labels:
            start_index = self.labels["MAIN"]
            print(f"🟢 INICIO detectado en etiqueta: MAIN")
        elif "BEGIN" in self.labels:
            start_index = self.labels["BEGIN"]
            print(f"🟢 INICIO detectado en etiqueta: BEGIN")
        else:
            # Si no encuentra etiquetas comunes, busca la directiva ORG #4000
            for i, line in enumerate(self.lines):
                if "ORG" in line.upper() and ("4000" in line or "$4000" in line):
                    start_index = i
                    print(f"🟢 INICIO detectado por ORG #4000 en línea {i+1}")
                    break

        # Reiniciar contador global por ejecución
        self.total_steps = 0

        print("="*60)
        self._trace_recursive(start_index, 0)
        print("="*60)
        print("\n🏁 Fin del análisis de flujo.")

    def _trace_recursive(self, line_index, depth):
        """Función recursiva que recorre el código"""
        if depth > 20:
            print("  " * depth + "⚠️ [DETENIDO: Profundidad máxima alcanzada]")
            return

        current_idx = line_index
        local_seen = set()  # Control de líneas ya vistas en esta rama

        while current_idx < len(self.lines):
            if self.total_steps >= self.max_steps:
                print("  " * depth + "[DETENIDO: Límite de pasos alcanzado]")
                return

            if current_idx in local_seen:
                print("  " * depth + f"[BUCLE detectado en línea {current_idx+1}, se detiene esta rama]")
                return

            local_seen.add(current_idx)
            self.total_steps += 1

            line = self.lines[current_idx]
            
            # Ignorar líneas vacías o puramente comentarios
            if not line or line.startswith(';'):
                current_idx += 1
                continue

            # Omitir definiciones EQU en la salida
            if re.search(r'\bEQU\b', line, re.IGNORECASE):
                current_idx += 1
                continue

            # Detectar fin de rutina (RET)
            if re.search(r'\bRET\b', line.upper()):
                comment = self.get_comment(line)
                desc = f" ({comment})" if comment else ""
                print("  " * depth + f"⬅️ RETORNA {desc}")
                return # Salir de esta rama

            # Detectar CALL (Llamada a subrutina)
            call_match = re.search(r'\bCALL\s+([a-zA-Z0-9_#$]+)', line, re.IGNORECASE)
            if call_match:
                target = call_match.group(1)
                comment = self.get_comment(line)
                
                # Verificar si es una llamada BIOS conocida
                bios_desc = ""
                clean_target = target.replace('#', '').replace('$', '').replace('0x', '').upper().zfill(4)
                if clean_target in self.msx_bios:
                    bios_desc = f" [{self.msx_bios[clean_target]}]"

                desc = f" -- {comment}" if comment else ""
                print("  " * depth + f"📞 LLAMA a {target}{bios_desc}{desc}")

                # Si es una etiqueta interna, entramos en ella (Recursión)
                if target in self.labels:
                    if target in self.visited_stack:
                        print("  " * (depth+1) + "🔄 (Recursión detectada/Bucle, no entramos)")
                    else:
                        self.visited_stack.append(target)
                        self._trace_recursive(self.labels[target], depth + 1)
                        self.visited_stack.pop()
                
                current_idx += 1
                continue

            # Detectar JP (Salto incondicional o condicional importante)
            # Nota: Tratamos JR (Jump Relative) similar para visualización
            jump_match = re.search(r'\b(JP|JR)\s+(?:[A-Z]{1,2},)?\s*([a-zA-Z0-9_]+)', line, re.IGNORECASE)
            if jump_match:
                instruction = jump_match.group(1).upper()
                target = jump_match.group(2)
                
                # Detectar bucle infinito sobre sí mismo ($)
                if target == '$' or target == 'Here' or (target in self.labels and self.labels[target] == current_idx):
                    print("  " * depth + f"🛑 BUCLE INFINITO ({instruction} $)")
                    return

                comment = self.get_comment(line)
                desc = f" -- {comment}" if comment else ""
                
                print("  " * depth + f"👉 SALTA a {target} ({instruction}){desc}")
                
                # Si es un salto incondicional, movemos el índice principal y seguimos
                # Si es condicional (NZ, Z, C), en análisis estático simple seguimos linealmente
                # pero mostramos la "rama" visualmente.
                is_conditional = ',' in line # Forma simple de detectar JP NZ, Label
                
                if target in self.labels:
                    if not is_conditional:
                         # Si es incondicional (JP Label), cambiamos el flujo completamente
                        if target in self.visited_stack:
                             print("  " * (depth+1) + "🔄 (Ciclo detectado)")
                             return
                        current_idx = self.labels[target]
                        continue
                    else:
                        # Si es condicional, mostramos que "podría" ir allí, pero seguimos leyendo abajo
                        # Opcional: Podríamos hacer fork del análisis aquí.
                        pass

            # Detectar DJNZ (Loop rápido Z80)
            djnz_match = re.search(r'\bDJNZ\s+([a-zA-Z0-9_]+)', line, re.IGNORECASE)
            if djnz_match:
                target = djnz_match.group(1)
                print("  " * depth + f"🔄 BUCLE DJNZ hacia {target} (Decrementa B, salta si no es 0)")

            # Mostrar instrucciones "importantes" (LD, OUT, etc) si tienen comentarios explicativos
            # Esto ayuda a entender qué hace el bloque
            comment = self.get_comment(line)
            if comment and not (call_match or jump_match or re.search(r'\bRET\b', line.upper())):
                # Limpiamos un poco la instrucción para mostrarla
                instr_only = line.split(';')[0].strip()
                print("  " * depth + f"   ⚙️  {instr_only} \t({comment})")

            current_idx += 1

# --- BLOQUE DE CREACIÓN DE EJEMPLO ---
def create_sample_asm():
    """Crea un archivo .asm de prueba si no existe"""
    filename = "demo_juego_msx.asm"
    code = """
    ; Cabecera ROM estándar MSX
    ORG #4000
    DB "AB"
    DW START
    DW 0, 0, 0

START:
    DI              ; Deshabilitar interrupciones
    LD SP, #D000    ; Configurar Stack Pointer
    
    CALL INIT_VIDEO ; Configurar VDP
    CALL LOAD_GFX   ; Cargar gráficos en VRAM
    
    EI              ; Habilitar interrupciones

MAIN_LOOP:
    CALL READ_INPUT ; Leer joystick/teclado
    CALL UPDATE_GAME; Lógica del juego
    CALL DRAW_FRAME ; Pintar sprites
    
    JP MAIN_LOOP    ; Repetir infinitamente

; --- Subrutinas ---

INIT_VIDEO:
    LD A, 1
    LD (HasVideo), A ; Bandera de video activado
    CALL #00D5      ; Cambiar a SCREEN 1 (BIOS CHGMOD)
    CALL #00C3      ; Borrar pantalla (BIOS CLS)
    RET

LOAD_GFX:
    LD HL, GFX_DATA ; Origen de datos
    LD DE, #1800    ; Destino en VRAM (Tabla generador patrones)
    LD BC, 256      ; Longitud
    CALL #005F      ; Transferir bloque a VRAM (BIOS LDIRVM)
    RET

READ_INPUT:
    LD A, 8         ; Leer fila 8 (Cursores)
    CALL #00A2      ; BIOS SNSMAT
    LD (Keys), A    ; Guardar estado teclas
    RET

UPDATE_GAME:
    LD A, (Keys)
    CP 0            
    JP Z, NO_MOVE   ; Si no hay teclas, saltar
    
    ; Lógica de movimiento
    LD HL, PlayerX
    INC (HL)        ; Mover jugador derecha
    
NO_MOVE:
    RET

DRAW_FRAME:
    ; Aquí iría código de sprites
    NOP
    RET

; Datos
GFX_DATA: DB 0,0,0,0
PlayerX:  DB 100
Keys:     DB 0
HasVideo: DB 0
    """
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)
    return filename

# --- MAIN ---
if __name__ == "__main__":
    # Si se pasa un argumento, usar ese archivo, si no, crear demo
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    else:
        print("No se especificó archivo. Creando 'demo_juego_msx.asm' de prueba...")
        target_file = create_sample_asm()
        print(f"Archivo creado: {target_file}\n")

    analyzer = Z80FlowAnalyzer(target_file)
    if analyzer.load_file():
        analyzer.analyze_flow()
