import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { RequestManager } from '../services/requestManager';
import { environment } from './../../../environments/environment';
import { QrService } from '../services/qrService';
import { UtilService } from '../services/utilService';
import { InfoComplementaria } from '../../@core/models/info_complementaria';
import { Tercero } from '../../@core/models/tercero';
import { InfoComplementariaTercero } from '../../@core/models/info_complementaria_tercero';
import { Router } from '@angular/router';
import { UserService } from '../services/userService';
import { combineLatest, from } from 'rxjs';
import { map, mergeMap, subscribeOn, } from 'rxjs/operators';

export interface Opcion {
  name: string;
  isSelected: boolean;
  label: string;
}

@Component({
  selector: 'app-preexistencia',
  templateUrl: './preexistencia.component.html',
  styleUrls: ['./preexistencia.component.scss'],
})
export class PreexistenciaComponent implements OnInit {
  isPost = true;
  decision_presencialidad: boolean = false;

  isAgree = false;
  tercero: Tercero;
  allNullComorbilidades = false;
  allNullOtros = false;
  cantidad: number = 0;
  constructor(
    private utilService: UtilService,
    private qrService: QrService,
    private request: RequestManager,
    private userService: UserService,
    private router: Router
  ) { }

  vinculaciones: Opcion[] = [];
  comorbilidades: Opcion[] = [];
  otros: Opcion[] = [];

  consultarCaracterizacion() {
    Swal.fire({
      title: 'Por favor espere!',
      html: `cargando información de formulario`,
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
          Swal.showLoading()
        },
    });
    this.userService.tercero$
      .subscribe((tercero: any) => {
        this.tercero = tercero;
        if (typeof tercero.Id !== 'undefined') {
          combineLatest(
            this.request.get(environment.TERCEROS_SERVICE, `/info_complementaria?query=GrupoInfoComplementariaId.Id:47&limit=0&order=asc&sortby=Id&fields=Id,Nombre`),
            this.request.get(environment.TERCEROS_SERVICE, `/info_complementaria?query=GrupoInfoComplementariaId.Id:48&order=asc&sortby=Id&limit=0&fields=Id,Nombre`),
            this.request.get(environment.TERCEROS_SERVICE, `vinculacion/?order=asc&sortby=Id&query=Activo:true,TerceroPrincipalId.Id:${tercero.Id}`),
            //------------------------------------------------------- formData -----------------------------------------------
            this.request.get(environment.TERCEROS_SERVICE,
              '/info_complementaria_tercero?limit=0&order=asc&sortby=Id&query=InfoComplementariaId.GrupoInfoComplementariaId.Id:47,TerceroId.Id:'
              + this.tercero.Id),
            this.request.get(environment.TERCEROS_SERVICE,
              '/info_complementaria_tercero?limit=0&order=asc&sortby=Id&query=InfoComplementariaId.GrupoInfoComplementariaId.Id:48,TerceroId.Id:'
              + this.tercero.Id)

          )
            .subscribe(
              ([consultaComorbilidades, consultaOtros, datosInfoVinculaciones, datosComorbilidades, datosOtros]: any) => {
                if (consultaComorbilidades) {
                  if (datosComorbilidades && JSON.stringify(datosComorbilidades) !== '[{}]') {                    
                    datosComorbilidades.sort((a, b) => (a.InfoComplementariaId.Id < b.InfoComplementariaId.Id ? -1 : 1));                    
                    this.isPost = false;
                    this.comorbilidades = consultaComorbilidades.map((comorbilidad, index) => ({
                      ...comorbilidad,
                      ...{ form: datosComorbilidades[index] },
                      label: comorbilidad['Nombre'],
                      isSelected: (JSON.parse(datosComorbilidades[index].Dato)).dato,
                      name: comorbilidad['Nombre']
                    }))

                  } else {
                    this.comorbilidades = consultaComorbilidades.map((comorbilidad, index) => ({
                      ...comorbilidad,
                      label: comorbilidad['Nombre'],
                      isSelected: false,
                      name: comorbilidad['Nombre']
                    }))
                    Swal.close();
                  }                  
                  this.cantidad = this.comorbilidades.filter(t => t.isSelected).length;
                  if (this.cantidad > 0) {
                    this.allNullComorbilidades = false;
                  } else {
                    this.allNullComorbilidades = true;
                  }
                }
                if (consultaOtros ) {
                  if (datosOtros && JSON.stringify(datosOtros) !== '[{}]') {
                    datosOtros.sort((a, b) => (a.InfoComplementariaId.Id < b.InfoComplementariaId.Id ? -1 : 1));
                    this.isPost = false;
                    this.otros = consultaOtros.map((otro, index) => ({
                      ...otro,
                      ...{ form: datosOtros[index] },
                      label: otro['Nombre'],
                      isSelected: (JSON.parse(datosOtros[index].Dato)).dato,
                      name: otro['Nombre']
                    }))
                  } else {
                    this.otros = consultaOtros.map((otro, index) => ({
                      ...otro,
                      label: otro['Nombre'],
                      isSelected: false,
                      name: otro['Nombre']
                    }))
                    Swal.close();
                  }
                  
                  this.cantidad = this.otros.filter(t => t.isSelected).length;
                  if (this.cantidad > 0) {
                    this.allNullOtros = false;
                  } else {
                    this.allNullOtros = true;
                  }
                }
                if (datosInfoVinculaciones) {
                  datosInfoVinculaciones.map((datosInfoVinculacion, index) => {
                    this.request.get(environment.PARAMETROS_SERVICE, `parametro/` + datosInfoVinculacion.TipoVinculacionId)
                      .subscribe((dataRequestInfoVinculacion) => {
                        const vinculacionP = dataRequestInfoVinculacion['Data'];
                        this.vinculaciones.push({
                          ...datosInfoVinculacion,
                          label: vinculacionP.Nombre,
                          isSelected: datosInfoVinculacion.Alternancia?datosInfoVinculacion.Alternancia:false,
                          name: vinculacionP.Nombre
                        });
                        if( datosInfoVinculaciones.length === this.vinculaciones.length){
                          Swal.close();
                        }
                      },
                      (error) => {
                        Swal.close();
                        console.log(error);
                      });
                  })
                }else  {
                  Swal.close();
                }
              },
              (error) => {
                Swal.close();
                console.log(error);
              });
        }else {
         Swal.close();
        }
      },
      (error) => {
        Swal.close();
        console.log(error);
      });

  }


  validarDesicionPresencialidad(nombreCheck: string, isChecked: boolean) {
    if (nombreCheck == 'decision_presencialidad') {
      this.decision_presencialidad = isChecked;
      this.otros = this.otros.map(option => ({ ...option, ...{ isSelected: false } }));
    }
  }

  async ngOnInit() {
    this.consultarCaracterizacion();
    //this.cargarComorbilidades()
    const comorbilidad = localStorage.getItem('comorbilidad');
    if (comorbilidad) {
      const objComorbilidades = JSON.parse(comorbilidad);
      this.qrService.updateData(objComorbilidades);
      this.comorbilidades = this.comorbilidades.map((c: Opcion) => {
        return {
          ...c,
          isSelected: objComorbilidades.info.hasOwnProperty(c.name) ? objComorbilidades.info[c.name] : false,
        };
      });
      this.otros = this.otros.map((c: Opcion) => {
        return {
          ...c,
          isSelected: objComorbilidades.info.hasOwnProperty(c.name) ? objComorbilidades.info[c.name] : false,
        };
      });
    }
    
  }

  clear(): void {    
    this.comorbilidades = this.comorbilidades.map(option => ({ ...option, ...{ isSelected: false } }));
    this.otros = this.otros.map(option => ({ ...option, ...{ isSelected: false } }));
    this.vinculaciones = this.vinculaciones.map(option => ({ ...option, ...{ isSelected: false } }));
    this.allNullComorbilidades = true;
    this.allNullOtros = true;
    //console.log(this.comorbilidades.filter(t => t.isSelected).length)    

    
  }

  validarChecksCO() {    
    this.cantidad = this.comorbilidades.filter(t => t.isSelected).length;          
     if (this.cantidad  > 0) {
       this.allNullComorbilidades = false;       
    } else {
      this.allNullComorbilidades = true;
    } 
  }

  vaciarChecksCO() {
    if (this.allNullComorbilidades) {
      this.comorbilidades = this.comorbilidades.map(option => ({ ...option, ...{ isSelected: false } }));      
    }
  }

  validarChecksOtros() {    
    this.cantidad = this.otros.filter(t => t.isSelected).length;          
     if (this.cantidad  > 0) {
       this.allNullOtros = false;       
    } else {
      this.allNullOtros = true;
    } 
  }

  vaciarChecksOtros() {
    if (this.allNullOtros) {
      this.otros = this.otros.map(option => ({ ...option, ...{ isSelected: false } }));      
    }      
  }
  

  updateStorage() {
    let saveData = {
      comorbilidades: this.comorbilidades,
      info: {},
      date: new Date(),
    };

    this.comorbilidades.map(data => {
      saveData.info[data.name] = data.isSelected;
    });

    this.otros.map(data => {
      saveData.info[data.name] = data.isSelected;
    });
    localStorage.setItem('comorbilidad', JSON.stringify(saveData));
  }

  

  async save() {


    const isValidTerm = await this.utilService.termsAndConditional();
    let caracterizaciones = [...this.comorbilidades, ...this.otros];

    if (isValidTerm) {
      Swal.fire({
        title: 'Información de caracterización',
        text: `Se ${this.isPost ? 'almacenará' : 'actualizará'} la información correspondiente a la caracterización`,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: this.isPost ? 'Guardar' : 'Actualizar',
      }).then(result => {
        if (result.value) {
          Swal.fire({
            title: '¡Por favor espere!',
            html: this.isPost ? 'Guardando' : 'Actualizando' + ' caracterización',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading();
            },
          });

          if (this.tercero) {
            Swal.fire({
              title: this.isPost ? 'Guardando' : 'Actualizando' + ' caracterización',
              html: `<b></b> de ${caracterizaciones.length + this.vinculaciones.length} registros ${this.isPost ? 'almacenados' : 'actualizados'}`,
              timerProgressBar: true,
              willOpen: () => {
                Swal.showLoading();
              },
            });

            let vinculacionesC = this.vinculaciones.map((vinculacion: any) => {
              const newVinculacion = {...vinculacion};
              newVinculacion.Alternancia = newVinculacion.isSelected;
              delete newVinculacion.label;
              delete newVinculacion.isSelected;
              delete newVinculacion.name;
              delete newVinculacion.nombreVinculacion;
              return newVinculacion
            })
            from(vinculacionesC)
              .subscribe((vinculacionC: any) => {
                this.request.put(environment.TERCEROS_SERVICE, 'vinculacion', vinculacionC, vinculacionC.Id)
                  .subscribe((data) => {

                  }),
                  error => {
                    Swal.fire({
                      title: 'error',
                      text: `${JSON.stringify(error)}`,
                      icon: 'error',
                      showCancelButton: true,
                      cancelButtonText: 'Cancelar',
                      confirmButtonText: `Aceptar`,
                    });
                  };
              })

            let updated = this.vinculaciones.length;
            from(caracterizaciones)
              .subscribe((caracterizacion: any) => {
                let caracterizacionTercero = {
                  TerceroId: { Id: this.tercero.Id },
                  InfoComplementariaId: {
                    Id: caracterizacion.Id,
                  },
                  Dato: JSON.stringify({ dato: caracterizacion.isSelected }),
                  Activo: true,
                };
                this.updateStorage()

                if (this.isPost) {
                  this.request
                    .post(environment.TERCEROS_SERVICE, 'info_complementaria_tercero/', caracterizacionTercero)
                    .subscribe((data: any) => {
                      const content = Swal.getContent();
                      if (content) {
                        const b = content.querySelector('b');
                        if (b) {
                          b.textContent = `${updated}`;
                        }
                      }
                      updated += 1;
                      if (updated === (caracterizaciones.length + this.vinculaciones.length)) {
                        Swal.close();
                        Swal.fire({
                          title: `Registro correcto`,
                          text: `Se ingresaron correctamente ${caracterizaciones.length + this.vinculaciones.length} registros`,
                          icon: 'success',
                        }).then((result) => {
                          if (result.value) {
                            this.router.navigate(['/pages']);
                          }
                        })
                        this.isPost = false;
                      }
                    }),
                    error => {
                      Swal.fire({
                        title: 'error',
                        text: `${JSON.stringify(error)}`,
                        icon: 'error',
                        showCancelButton: true,
                        cancelButtonText: 'Cancelar',
                        confirmButtonText: `Aceptar`,
                      });
                    };
                } else {
                  this.request
                    .put(environment.TERCEROS_SERVICE, 'info_complementaria_tercero', caracterizacionTercero, caracterizacion.form.Id)
                    .subscribe((data: any) => {
                      const content = Swal.getContent();
                      if (content) {
                        const b = content.querySelector('b');
                        if (b) {
                          b.textContent = `${updated}`;
                        }
                      }
                      updated += 1;
                      if (updated === (caracterizaciones.length + this.vinculaciones.length)) {
                        Swal.close();
                        Swal.fire({
                          title: `Actualización correcta`,
                          text: `Se actualizaron correctamente ${caracterizaciones.length + this.vinculaciones.length} registros`,
                          icon: 'success',
                        }).then((result) => {
                          if (result.value) {
                            this.router.navigate(['/pages']);
                          }
                        })
                      }
                    }),
                    error => {
                      Swal.fire({
                        title: 'error',
                        text: `${JSON.stringify(error)}`,
                        icon: 'error',
                        showCancelButton: true,
                        cancelButtonText: 'Cancelar',
                        confirmButtonText: `Aceptar`,
                      });
                    };
                }
              });
          }
        }
      });
    }
  }

}
