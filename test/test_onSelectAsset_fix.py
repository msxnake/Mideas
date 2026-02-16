#!/usr/bin/env python3
"""
Script para probar la funcionalidad onSelectAsset después del fix.
Este script automatiza el navegador para hacer clic en assets y verificar que no hay errores.
"""

import time
import subprocess
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def setup_chrome_driver():
    """Configura el driver de Chrome con opciones optimizadas."""
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    # Habilitar logs de consola para capturar errores JavaScript
    chrome_options.add_argument("--enable-logging")
    chrome_options.add_argument("--log-level=0")

    return webdriver.Chrome(options=chrome_options)

def test_onSelectAsset_functionality():
    """Testa la funcionalidad onSelectAsset en la aplicación."""

    # URL de la aplicación
    app_url = "http://localhost:5175"

    print("🚀 Iniciando test de onSelectAsset...")

    driver = setup_chrome_driver()

    try:
        # 1. Abrir la aplicación
        print(f"📂 Abriendo aplicación en {app_url}")
        driver.get(app_url)

        # 2. Esperar a que la aplicación cargue
        wait = WebDriverWait(driver, 15)

        print("⏳ Esperando que la aplicación cargue...")
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(3)

        # 3. Buscar el panel de explorador de archivos
        print("🔍 Buscando FileExplorerPanel...")

        # Intentar encontrar elementos que podrían ser assets
        asset_selectors = [
            "[data-testid*='asset']",
            ".asset-item",
            ".file-item",
            "button[title*='Select']",
            "[role='button']"
        ]

        assets_found = []
        for selector in asset_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    assets_found.extend(elements)
                    print(f"✅ Encontrados {len(elements)} elementos con selector: {selector}")
            except Exception as e:
                print(f"❌ Error con selector {selector}: {e}")

        # 4. Tomar captura antes del test
        print("📸 Tomando captura antes del test...")
        driver.save_screenshot("before_asset_click.png")

        # 5. Verificar errores de consola inicial
        initial_console_errors = []
        logs = driver.get_log('browser')
        for log in logs:
            if log['level'] == 'SEVERE':
                initial_console_errors.append(log['message'])

        if initial_console_errors:
            print(f"⚠️  Errores de consola iniciales encontrados: {len(initial_console_errors)}")
            for error in initial_console_errors:
                print(f"   📄 {error}")
        else:
            print("✅ Sin errores de consola iniciales")

        # 6. Intentar hacer clic en un asset
        clicked_successfully = False

        if assets_found:
            print(f"🎯 Intentando hacer clic en el primer asset de {len(assets_found)} encontrados...")

            try:
                first_asset = assets_found[0]
                driver.execute_script("arguments[0].scrollIntoView(true);", first_asset)
                time.sleep(1)

                first_asset.click()
                print("✅ Clic realizado exitosamente")
                clicked_successfully = True
                time.sleep(2)

            except Exception as e:
                print(f"❌ Error al hacer clic en asset: {e}")
        else:
            print("❌ No se encontraron assets para hacer clic")

        # 7. Verificar errores después del clic
        time.sleep(2)
        post_click_console_errors = []
        logs = driver.get_log('browser')
        for log in logs:
            if log['level'] == 'SEVERE' and log['message'] not in [e for e in initial_console_errors]:
                post_click_console_errors.append(log['message'])

        # 8. Verificar específicamente el error "onSelectAsset is not a function"
        onSelectAsset_error_found = False
        for error in post_click_console_errors:
            if "onSelectAsset is not a function" in error:
                onSelectAsset_error_found = True
                break

        # 9. Tomar captura después del test
        print("📸 Tomando captura después del test...")
        driver.save_screenshot("after_asset_click.png")

        # 10. Resultados del test
        print("\n" + "="*50)
        print("📊 RESULTADOS DEL TEST")
        print("="*50)

        if onSelectAsset_error_found:
            print("❌ FALLO: Error 'onSelectAsset is not a function' AÚN PRESENTE")
            print("🔧 El fix NO funcionó correctamente")
            return False

        elif post_click_console_errors:
            print("⚠️  ADVERTENCIA: Se encontraron otros errores de consola:")
            for error in post_click_console_errors:
                print(f"   📄 {error}")
            print("✅ Pero NO hay error de 'onSelectAsset is not a function'")
            return True

        elif clicked_successfully:
            print("✅ ÉXITO: Clic en asset realizado sin errores de 'onSelectAsset'")
            print("🎉 El fix funcionó correctamente")
            return True

        else:
            print("❓ INCONCLUSO: No se pudo hacer clic en assets para probar")
            return None

    except Exception as e:
        print(f"❌ Error general en el test: {e}")
        driver.save_screenshot("error_screenshot.png")
        return False

    finally:
        driver.quit()

def main():
    """Función principal del script de testing."""
    print("🧪 Test de funcionalidad onSelectAsset")
    print("=====================================")

    # Verificar que el servidor está corriendo
    try:
        import requests
        response = requests.get("http://localhost:5175", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor detectado en http://localhost:5175")
        else:
            print("❌ Servidor no responde correctamente")
            return
    except Exception as e:
        print(f"❌ No se puede conectar al servidor: {e}")
        print("💡 Asegúrate de que 'npm run dev' esté ejecutándose")
        return

    # Ejecutar el test
    result = test_onSelectAsset_functionality()

    if result is True:
        print("\n🎉 TEST EXITOSO: El problema onSelectAsset está resuelto")
    elif result is False:
        print("\n❌ TEST FALLIDO: El problema onSelectAsset persiste")
    else:
        print("\n❓ TEST INCONCLUSO: No se pudo determinar el estado")

if __name__ == "__main__":
    main()