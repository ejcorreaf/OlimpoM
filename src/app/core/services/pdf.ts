import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  async generarPdfRutina(rutina: any, elementId: string = 'rutina-content'): Promise<void> {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error('Elemento no encontrado para generar PDF');
    }

    // Ocultar elementos que no queremos en el PDF
    this.ocultarElementosNoDeseados();

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Mejor calidad
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Añadir páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Restaurar elementos ocultos
      this.mostrarElementosOcultos();

      // Descargar el PDF
      pdf.save(`rutina-${rutina.nombre}-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      // Restaurar elementos ocultos en caso de error
      this.mostrarElementosOcultos();
      throw error;
    }
  }

  private ocultarElementosNoDeseados(): void {
    // Ocultar botones y elementos de navegación
    const elementosAOcultar = document.querySelectorAll('.btn, [routerLink], nav, header, footer');
    elementosAOcultar.forEach(el => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
  }

  private mostrarElementosOcultos(): void {
    // Mostrar elementos ocultados
    const elementosOcultos = document.querySelectorAll('.btn, [routerLink], nav, header, footer');
    elementosOcultos.forEach(el => {
      (el as HTMLElement).style.visibility = 'visible';
    });
  }

  // Método alternativo para generar PDF más personalizado
  async generarPdfRutinaPersonalizado(rutina: any): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;

    // Título
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RUTINA DE ENTRENAMIENTO', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Información de la rutina
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Rutina: ${rutina.nombre}`, 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    if (rutina.descripcion) {
      const descripcionLines = pdf.splitTextToSize(rutina.descripcion, 170);
      pdf.text(descripcionLines, 20, yPosition);
      yPosition += descripcionLines.length * 6 + 5;
    }

    // Estadísticas
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resumen:', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Total de ejercicios: ${rutina.ejercicios?.length || 0}`, 25, yPosition);
    yPosition += 6;
    pdf.text(`• Series totales: ${this.calcularTotalSeries(rutina)}`, 25, yPosition);
    yPosition += 6;
    pdf.text(`• Tiempo estimado: ${this.calcularTiempoEstimado(rutina)} minutos`, 25, yPosition);
    yPosition += 15;

    // Ejercicios agrupados por grupo muscular
    const grupos = this.agruparPorGrupoMuscular(rutina.ejercicios || []);

    for (const [grupo, ejercicios] of Object.entries(grupos)) {
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(`Grupo: ${grupo.toUpperCase()}`, 20, yPosition);
      yPosition += 10;

      for (const ejercicio of ejercicios) {
        // Verificar si necesitamos nueva página para el siguiente ejercicio
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(`• ${ejercicio.nombre}`, 25, yPosition);
        yPosition += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        if (ejercicio.descripcion) {
          const descLines = pdf.splitTextToSize(ejercicio.descripcion, 160);
          pdf.text(descLines, 30, yPosition);
          yPosition += descLines.length * 5;
        }

        // Detalles del ejercicio en la rutina
        pdf.text(`Series: ${ejercicio.pivot?.series || 0} | Reps: ${ejercicio.pivot?.repeticiones || 0} | Descanso: ${ejercicio.pivot?.descanso || 0}s`, 30, yPosition);
        yPosition += 8;
      }
      yPosition += 5;
    }

    // Pie de página
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generado el ${new Date().toLocaleDateString()}`, 20, 285);

    // Descargar PDF
    pdf.save(`rutina-${rutina.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  private calcularTotalSeries(rutina: any): number {
    if (!rutina?.ejercicios) return 0;
    return rutina.ejercicios.reduce((total: number, ejercicio: any) => {
      return total + (ejercicio.pivot?.series || 0);
    }, 0);
  }

  private calcularTiempoEstimado(rutina: any): number {
    if (!rutina?.ejercicios) return 0;
    const tiempoPorEjercicio = 3;
    const tiempoExtra = 10;
    return Math.round(rutina.ejercicios.length * tiempoPorEjercicio + tiempoExtra);
  }

  private agruparPorGrupoMuscular(ejercicios: any[]): { [key: string]: any[] } {
    if (!ejercicios || ejercicios.length === 0) return {};
    
    return ejercicios.reduce((grupos, ejercicio) => {
      const grupo = ejercicio.grupo_muscular || 'general';
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(ejercicio);
      return grupos;
    }, {} as { [key: string]: any[] });
  }
}