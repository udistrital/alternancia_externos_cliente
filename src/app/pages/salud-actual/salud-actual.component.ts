import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { RequestManager } from '../services/requestManager';
import { UserService } from '../services/userService';
import { UtilService } from '../services/utilService';
import Swal from 'sweetalert2';

export interface Task {
  name: string;
  isSelected: boolean;
  label: string;
}

@Component({
  selector: 'app-salud-actual',
  templateUrl: './salud-actual.component.html',
  styleUrls: ['./salud-actual.component.scss']
})
export class SaludActualComponent implements OnInit {
  tercero = null;
  cantidad: number = 0;
  allNullSintomas = false;
  task: Task[] = [
    { name: 'fiebre', isSelected: false, label: 'Registra una temperatura superior a 37°C'},
    { name: 'congestion_nasal', isSelected: false, label: 'Congestión Nasal'},
    { name: 'dificultad_respiratoria', isSelected: false, label: 'Dificultad respiratoria'},
    { name: 'agotamiento', isSelected: false, label: 'Agotamiento'},
    { name: 'malestar_general', isSelected: false, label: 'Malestar general'},
    { name: 'estado_embarazo', isSelected: false, label: 'Estado de embarazo'},
    { name: 'contacto_covid', isSelected: false, label: 'Ha estado en contacto con personas positivo para Covid 19'},
  ]
  constructor(private utilService: UtilService,
              private user:UserService,
              private request: RequestManager) {
      
  }
  ngOnInit() {
    this.user.tercero$.subscribe((tercero: any) => {
      if(typeof tercero.Id !== 'undefined') {
        this.tercero = tercero;
        return this.request.get(environment.SINTOMAS_SERVICE, 
          'sintomas?limit=1&order=desc&sortby=fecha_creacion&query=terceroId:'+ this.tercero.Id)
        .subscribe(
          (data: any) => {
            if(data.Data.length > 0){
            this.allNullSintomas = true;
            const actualStatus = data.Data[0].info_salud;
            this.task = this.task.map((c: Task) => {              
              return {
                ...c,
                isSelected: actualStatus.hasOwnProperty(c.name) ? actualStatus[c.name] : false
              }
            })
            for (let reg of this.task){
              if (reg.isSelected){
                this.allNullSintomas = false;
              }
            }
          }
          },
          (error: any) => {
            console.log(error)
          }
        )
      }
    })
  }

  clear(): void {
    this.task = this.task.map((option)=>({...option, ...{isSelected: false}}))
    this.allNullSintomas = true;
  }

  vaciarChecksS() {
    if (this.allNullSintomas) {
      this.task = this.task.map(option => ({ ...option, ...{ isSelected: false } }));      
    }
  }

  validarChecksS() {    
    this.cantidad = this.task.filter(t => t.isSelected).length;          
     if (this.cantidad  > 0) {
       this.allNullSintomas = false;       
    } else {
      this.allNullSintomas = true;
    } 
  }

  save(): void {
    let saveData = {};
    this.task.map((data) => {
      saveData[data.name] = data.isSelected;
    })
    if (this.tercero){
    const newHealthState = {
      terceroId: this.tercero.Id,
      info_salud: saveData,
      activo: true,
    }
      Swal.fire({
            title: 'Estado de salud actual',
            text: `Se almacenará el estado de salud actual`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: `guardar`
        })
        .then((result) => {
            if (result.value) {
              if(this.tercero) {
                Swal.fire({
                  title: 'Por favor espere!',
                  html: `guardando estado de salud`,
                  allowOutsideClick: false,
                  showConfirmButton: false,
                  willOpen: () => {
                      Swal.showLoading()
                    },
                });
                return this.request.post(environment.SINTOMAS_SERVICE, 'sintomas',newHealthState)
                .subscribe(
                  (data: any)=> {
                    if(data.Status) {
                      Swal.fire({
                        title: 'Estado de salud actual',
                        text: `Se almacenó exitosamente`,
                        icon: 'success',
                        showCancelButton: true,
                    })
                    }else  {

                    }
                  }),
                  (error) => {
                    Swal.fire({
                      title: 'error',
                      text: `${JSON.stringify(error)}`,
                      icon: 'error',
                      showCancelButton: true,
                      cancelButtonText: 'Cancelar',
                      confirmButtonText: `guardar`
                  })
                  }
              }


              }
        })
      }
  }

}
