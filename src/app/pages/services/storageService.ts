import { Injectable } from '@angular/core';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    // Configuración inicial
    localforage.config({
      name: 'Metis',
      storeName: 'datos'
    });
  }

  // Guardar la imagen en Base64
  async guardarImagen(id: string, base64Data: string): Promise<void> {
    await localforage.setItem(id, base64Data);
  }

  // Recuperar la imagen para mostrarla en un <img [src]="foto">
  async obtenerImagen(id: string): Promise<string | null> {
    return await localforage.getItem<string>(id);
  }
}