# 🏡 MiVivienda Simulador Pro - Sistema de Créditos Hipotecarios

Una aplicación web moderna desarrollada con **Next.js 15** y **TypeScript** para la simulación, análisis y gestión de créditos hipotecarios bajo la modalidad del **Nuevo Crédito Mivivienda** en Perú. Utiliza el **método francés** de amortización y se integra con datos reales del mercado financiero peruano.

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- **Autenticación con Firebase**: Login seguro y gestión de sesiones persistentes.
- **Protección de Rutas**: Acceso restringido a dashboard y simulaciones solo para usuarios autenticados.
- **Gestión de Perfil**: Vinculación automática de simulaciones al usuario creador.

### 🏦 Simulador Financiero Inteligente
- **Cálculo de Bonos del Estado**:
  - **Bono del Buen Pagador (BBP)**: Automático según el valor de la vivienda.
  - **Bono Mivivienda Verde**: Cálculo opcional del 3% o 4% adicional.
- **Selección Inteligente de Bancos**: Detecta y sugiere bancos (BCP, Interbank, BBVA, etc.) basándose en la TEA ingresada.
- **Autocompletado de Tasas**: Aplica automáticamente las tasas de seguro de desgravamen reales del mercado según el banco detectado.

### 🧮 Motor de Cálculo Financiero
- **Método Francés**: Generación de cronogramas con cuota constante.
- **Indicadores Financieros**:
  - **VAN (Valor Actual Neto)**: Evaluación de rentabilidad con COK personalizada.
  - **TIR (Tasa Interna de Retorno)**: Cálculo preciso del costo mensual.
  - **TCEA (Tasa de Costo Efectivo Anual)**: Cálculo real incluyendo seguros y gastos.
- **Validación de Plazos**: Restricciones lógicas (5 a 25 años) para asegurar simulaciones realistas.

### 📊 Gestión de Resultados
- **Cronogramas Detallados**: Tabla completa mes a mes con desglose de capital, interés, seguros e ITF.
- **Historial en la Nube**: Guardado y recuperación de simulaciones desde **Firestore**.
- **Flujo de Pagos**: Vista dedicada para consultar simulaciones pasadas.
- **Exportación Profesional**: (Preparado para) generación de reportes en PDF.

### 🎨 Interfaz de Usuario
- **Diseño Moderno**: Interface construida con **Tailwind CSS**.
- **Responsive Design**: Optimizada para celulares, tablets y escritorio.
- **Formularios por Pasos**: Experiencia de usuario (UX) guiada (Vivienda -> Financiamiento -> Resultados).
- **Feedback Visual**: Validaciones con **Zod** y alertas de errores en tiempo real.

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15**: Framework React con App Router y Server Components.
- **TypeScript**: Tipado estático para mayor robustez.
- **Tailwind CSS**: Estilizado utilitario y responsive.
- **React Hook Form**: Gestión eficiente de formularios complejos.
- **Zod**: Esquemas de validación de datos.
- **Heroicons**: Iconografía vectorial ligera.

### Backend & Servicios
- **Firebase**:
  - **Authentication**: Gestión de usuarios.
  - **Firestore**: Base de datos NoSQL en tiempo real para guardar simulaciones.

### Herramientas de Cálculo
- **Algoritmos Financieros**: Módulos personalizados en TypeScript para matemáticas financieras (TIR, VAN, Amortización).

## 📁 Estructura del Proyecto

```bash
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/          # Panel principal
│   ├── login/              # Autenticación
│   ├── register/           # Registro de usuarios
│   ├── simulaciones/       # Módulo principal
│   │   ├── [id]/           # Detalle y cronograma
│   │   ├── list/           # Historial de flujos
│   │   └── nueva/          # Formulario de simulación
├── components/             # Componentes de UI
│   ├── layout/             # Sidebar, Header, Layouts protegidos
│   ├── simulaciones/       # Pasos del formulario y tarjetas
│   └── ui/                 # Componentes base (Inputs, Botones)
├── lib/                    # Lógica de negocio
│   ├── auth/               # Contexto de sesión
│   ├── calculations/       # Motor financiero (Core)
│   ├── firebase/           # Configuración de servicios
│   └── simulacion/         # Lógica de bonos, validaciones y datos de bancos

```

## 🚀 Instalación y Despliegue

### Prerrequisitos
* **Node.js 18+**
* **Cuenta de Firebase**

### Pasos de Instalación Local

1.  **Clonar el repositorio**

    ```bash
    git clone [url-del-repositorio]
    cd finance-app
    ```

2.  **Instalar dependencias**

    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Firebase:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```

4.  **Ejecutar en desarrollo**

    ```bash
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📱 Guía de Uso

* **Registro:** Crea una cuenta para acceder al sistema.
* **Nueva Simulación:**
    * **Paso 1:** Ingresa el valor de la vivienda. El sistema calculará los *Bonos del Estado* automáticamente.
    * **Paso 2:** Configura el financiamiento. Ingresa la TEA y el sistema sugerirá el Banco y la Tasa de Seguro adecuada. Define el plazo (5-25 años).
    * **Paso 3:** Revisa los resultados preliminares (Cuota, TCEA).
* **Guardar:** Almacena tu simulación en la nube.
* **Flujo de Pagos:** Accede desde el menú lateral para ver el cronograma detallado y los indicadores financieros (**VAN**, **TIR**) de tus simulaciones guardadas.

---

## 🤝 Contribución

Este es un proyecto académico/profesional. Si deseas contribuir:

1.  Haz un **Fork** del proyecto.
2.  Crea una rama (`git checkout -b feature/NuevaCaracteristica`).
3.  Haz Commit (`git commit -m 'Add: Nueva Característica'`).
4.  Haz Push (`git push origin feature/NuevaCaracteristica`).
5.  Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**.

> Desarrollado para el curso de **Finanzas e Ingeniería Económica**.
