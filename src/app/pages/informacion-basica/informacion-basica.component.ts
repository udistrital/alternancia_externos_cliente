import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup,FormControl,Validators, AbstractControl } from '@angular/forms';
import { RequestManager } from '../services/requestManager';
import Swal from 'sweetalert2';
import { UserService } from '../services/userService';
import { UtilService } from '../services/utilService';
import { DatosIdentificacion } from '../../@core/models/datos_identificacion';
import { environment } from './../../../environments/environment'
import { InfoComplementariaTercero } from '../../@core/models/info_complementaria_tercero';
import { Tercero } from '../../@core/models/tercero';
import { Vinculacion } from '../../@core/models/vinculacion';
import { CargaAcademica } from '../../@core/models/carga_academica';
import { LocalDataSource } from 'ng2-smart-table';
import { combineLatest, from } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-informacion-basica',
  templateUrl: './informacion-basica.component.html',
  styleUrls: ['./informacion-basica.component.scss']
})
export class InformacionBasicaComponent implements OnInit {
  isPost: boolean = true;
  infoVacunacion: any[] = [{ dato: '' }, { dato: '' }, { dato: '' }];
  maxDate: Date = new Date();
  minDate: Date = new Date(2021, 0, 1);
  tercero: Tercero;
  datosIdentificacion: DatosIdentificacion;
  datosGenero: InfoComplementariaTercero;
  datosLocalidad: InfoComplementariaTercero;
  isVacunacion: number;
  vinculacionesDocente: Vinculacion[];
  vinculacionesEstudiante: Vinculacion[];
  cargaAcademica: CargaAcademica[];
  vinculacionesOtros: Vinculacion[];
  datosEstadoCivil: InfoComplementariaTercero;
  vinculaciones: Vinculacion[];
  edad: number;
  source: LocalDataSource = new LocalDataSource();
  settings: any;

  formVacunacion: FormGroup;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private utilService: UtilService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
  }

  
  conditionallyRequiredValidator(formControl: AbstractControl) {
    if (!formControl.parent) {
      return null;
    }
    if (formControl.parent.get('radioVacunacion').value === 'true') {
      return Validators.required(formControl); 
    }
    return null;
  }

  getErrorMessage(campo: FormControl) {
    if (campo.hasError('required', )) {
      return 'Campo requerido';
    } else {
      return 'Introduzca un valor válido';
    }
  }

  cargarCampos() {
    this.settings = {
      actions: false,
      mode: 'external',
      columns: {
        Vinculacion: {
          title: 'Vinculacion',
          filter: false,
          valuePrepareFunction: (value) => value,
        },
        Proyecto: {
          title: 'Proyecto',
          filter: false,
          valuePrepareFunction: (value) => value,
        },
        Horario: {
          title: 'Horario',
          filter: false,
          valuePrepareFunction: (value) => value,
        },
        Asignatura: {
          title: 'Asignatura',
          filter: false,
          valuePrepareFunction: (value) => value,
        },
      },
    };
  }

  public corregirFecha(fecha: string): Date {
    let fechaHora = new Date(fecha);
    fechaHora.setHours(fechaHora.getHours() + 5);
    return fechaHora;
  }



  public calcularEdad(fechaNacimientoStr: string): number {
    if (fechaNacimientoStr) {
      const actual = new Date();
      const fechaNacimiento = new Date(fechaNacimientoStr);
      let edad = actual.getFullYear() - fechaNacimiento.getFullYear();
      const mes = actual.getMonth() - fechaNacimiento.getMonth();

      if (mes < 0 || (mes === 0 && actual.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }
      return edad;
    } else {
      return null
    }
  }

  public asignarVinculacion(vinculacion: Vinculacion) {
    let idRol: number = vinculacion.TipoVinculacion.Id;


    if (idRol != 293 && idRol != 294 && vinculacion.TipoVinculacion.ParametroPadreId != null) {
      vinculacion.TipoVinculacion.Nombre = vinculacion.TipoVinculacion.ParametroPadreId.Nombre;
    }

    if (idRol == 293 || idRol == 294 || (idRol >= 296 && idRol <= 299)) {
      let dateObj = new Date();
      let weekdayNumber = dateObj.getDay();
      this.vinculacionesDocente.push(vinculacion);
      this.request.get(environment.ACADEMICA_JBPM_SERVICE, `carga_academica/${new Date().getFullYear()}/1/${this.datosIdentificacion.Numero}/${weekdayNumber}`)
        .subscribe((carga: any) => {
          if (carga) {
            this.cargaAcademica = carga['carga_academica']['docente'];
            let datosCarga = this.cargaAcademica.map((carga) =>
              new Object({
                Vinculacion: `${carga.VINCULACION}`,
                Proyecto: `${carga.FACULTAD} - ${carga.PROYECTO}`,
                Horario: `${carga.SALON} - ${carga.DIA} - ${carga.HORA}`,
                Asignatura: `${carga.CODIGO_ASIGNATURA} - ${carga.ASIGNATURA} - GR ${carga.GRUPO}`,
              }))
            this.source.load(datosCarga)

          }
        }, (error) => {
          console.log(error);
          Swal.close();
        })

    } else if (vinculacion.TipoVinculacion.ParametroPadreId) {
      if (vinculacion.TipoVinculacion.ParametroPadreId.Id == 346) {
        this.vinculacionesEstudiante.push(vinculacion);
      } else {
        this.vinculacionesOtros.push(vinculacion);
      }
    } else if (vinculacion.TipoVinculacion.Id == 346) {
      this.vinculacionesEstudiante.push(vinculacion);
    } else {
      this.vinculacionesOtros.push(vinculacion);
    }
  }

  consultarInfoVacunacion() {
    combineLatest(
      this.request.get(environment.TERCEROS_SERVICE, `/info_complementaria?query=GrupoInfoComplementariaId.Id:50&limit=0&order=asc&sortby=Id&fields=Id,Nombre`),
      //------------------------------------------------------- formData -----------------------------------------------
      this.request.get(environment.TERCEROS_SERVICE,
        '/info_complementaria_tercero?limit=0&order=asc&sortby=Id&query=InfoComplementariaId.GrupoInfoComplementariaId.Id:50,TerceroId.Id:'
        + this.tercero.Id)
    )
      .subscribe(
        ([consultaInfoVacunacion, datosInfoVacunacion, datosOtros]: any) => {
          if (consultaInfoVacunacion) {
            if (datosInfoVacunacion && JSON.stringify(datosInfoVacunacion) !== '[{}]') {
              datosInfoVacunacion.sort((a, b) => (a.InfoComplementariaId.Id < b.InfoComplementariaId.Id ? -1 : 1));
              this.isPost = false;
              this.infoVacunacion = consultaInfoVacunacion.map((itemVacunacion, index) => ({
                ...itemVacunacion,
                ...{ form: datosInfoVacunacion[index] },
                label: itemVacunacion['Nombre'],
                dato: index == 1 ? this.corregirFecha((JSON.parse(datosInfoVacunacion[index].Dato)).dato) : JSON.parse(datosInfoVacunacion[index].Dato).dato,
                name: itemVacunacion['Nombre']
              }))
              this.formVacunacion.get('radioVacunacion').setValue(this.infoVacunacion[0].dato);
              this.formVacunacion.get('fechaVacunacion').setValue(this.infoVacunacion[1].dato);
              this.formVacunacion.get('empresaVacunacion').setValue(this.infoVacunacion[2].dato);
            } else {
              this.isPost = true;
              this.infoVacunacion = consultaInfoVacunacion.map((itemVacunacion, index) => ({
                ...itemVacunacion,
                label: itemVacunacion['Nombre'],
                dato: "",
                name: itemVacunacion['Nombre']
              }))
              Swal.close();
            }
          }
        });
  }

  radioVacunacionActualizado() {
    this.formVacunacion.get('fechaVacunacion').setValue("");
    this.formVacunacion.get('empresaVacunacion').setValue("");
  }

  async save() {
    this.infoVacunacion[0].dato = this.formVacunacion.get('radioVacunacion').value;
    this.infoVacunacion[1].dato = this.infoVacunacion[0].dato=='true'?this.formVacunacion.get('fechaVacunacion').value:"";
    this.infoVacunacion[2].dato = this.infoVacunacion[0].dato=='true'?this.formVacunacion.get('empresaVacunacion').value:"";

    const isValidTerm = await this.utilService.termsAndConditional();

    if (isValidTerm) {
      Swal.fire({
        title: 'Información de vacunación',
        text: `Se ${this.isPost ? 'almacenará' : 'actualizará'} la información correspondiente al esquema de vacunación`,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: this.isPost ? 'Guardar' : 'Actualizar',
      }).then(result => {

        if (this.tercero && result.value) {
          Swal.fire({
            title: this.isPost ? 'Guardando' : 'Actualizando' + ' caracterización',
            html: `<b></b> de ${this.infoVacunacion.length} registros ${this.isPost ? 'almacenados' : 'actualizados'}`,
            timerProgressBar: true,
            willOpen: () => {
              Swal.showLoading();
            },
          });

          let updated = 0;

          from(this.infoVacunacion)
            .subscribe((itemVacunacion: any) => {

              let itemVacunacionTercero = {
                TerceroId: { Id: this.tercero.Id },
                InfoComplementariaId: {
                  Id: itemVacunacion.Id,
                },
                Dato: JSON.stringify({ dato: itemVacunacion.dato }),
                Activo: true,
              };

              if (this.isPost) {
                this.request
                  .post(environment.TERCEROS_SERVICE, 'info_complementaria_tercero/', itemVacunacionTercero)
                  .subscribe((data: any) => {
                    updated += 1;
                    const content = Swal.getContent();
                    if (content) {
                      const b = content.querySelector('b');
                      if (b) {
                        b.textContent = `${updated}`;
                      }
                    }

                    if (updated === (this.infoVacunacion.length)) {
                      Swal.close();
                      Swal.fire({
                        title: `Registro correcto`,
                        text: `Se ingresaron correctamente ${this.infoVacunacion.length} registros`,
                        icon: 'success',
                      }).then((result) => {
                        if (result.value) {
                          this.isPost = false;
                          window.location.reload();
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
                  .put(environment.TERCEROS_SERVICE, 'info_complementaria_tercero', itemVacunacionTercero, itemVacunacion.form.Id)
                  .subscribe((data: any) => {
                    updated += 1;
                    const content = Swal.getContent();
                    if (content) {
                      const b = content.querySelector('b');
                      if (b) {
                        b.textContent = `${updated}`;
                      }
                    }

                    if (updated === (this.infoVacunacion.length)) {
                      Swal.close();
                      Swal.fire({
                        title: `Actualización correcta`,
                        text: `Se actualizaron correctamente ${this.infoVacunacion.length} registros`,
                        icon: 'success',
                      }).then((result) => {
                        if (result.value) {
                          this.isPost = false;
                          window.location.reload();
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

              }

            });
        }
      });
    }
  }

  ngOnInit(): void {
    this.formVacunacion = this.formBuilder.group({
      radioVacunacion: ['', Validators.required],
      fechaVacunacion: ['', this.conditionallyRequiredValidator],
      empresaVacunacion: ['', this.conditionallyRequiredValidator]
    });
    this.formVacunacion.get('radioVacunacion').valueChanges
        .subscribe(value => {
            this.formVacunacion.get('fechaVacunacion').setValue("");
            this.formVacunacion.get('fechaVacunacion').updateValueAndValidity();
            this.formVacunacion.get('empresaVacunacion').setValue("");
            this.formVacunacion.get('empresaVacunacion').updateValueAndValidity();
    });

    this.cargarCampos();
    this.userService.user$.subscribe((data) => {
      this.request.get(environment.TERCEROS_SERVICE, `datos_identificacion/?query=Numero:` + data['userService']['documento'])
        .subscribe((datosInfoTercero: any) => {
          this.datosIdentificacion = {
            ...datosInfoTercero[0],
            ...{ FechaExpedicion: datosInfoTercero[0].FechaExpedicion ? this.corregirFecha(datosInfoTercero[0].FechaExpedicion) : '' }
          }
          this.tercero = this.datosIdentificacion.TerceroId;

          if (this.tercero) {
            this.tercero.FechaNacimiento = this.corregirFecha(this.tercero.FechaNacimiento);

            this.edad = this.calcularEdad(this.tercero ? this.tercero.FechaNacimiento ? this.tercero.FechaNacimiento : null : null);
            this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero/?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.Id:6`)
              .subscribe((datosInfoGenero: any) => {
                this.datosGenero = datosInfoGenero[0];
              }, (error) => {
                console.log(error);
              })

            this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero/?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.Id:2`)
              .subscribe((datosInfoEstadoCivil: any) => {
                this.datosEstadoCivil = datosInfoEstadoCivil[0];
              }, (error) => {
                console.log(error);
              })

            this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero/?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.CodigoAbreviacion:LOCBOG`)
              .subscribe((datosInfoLocalidad: any) => {
                this.datosLocalidad = datosInfoLocalidad[0];
              }, (error) => {
                console.log(error);
              })

            this.consultarInfoVacunacion();

            this.request.get(environment.TERCEROS_SERVICE, `vinculacion/?query=Activo:true,TerceroPrincipalId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`)
              .subscribe((datosInfoVinculaciones: any) => {
                this.vinculaciones = datosInfoVinculaciones;
                this.vinculacionesDocente = [];
                this.vinculacionesEstudiante = [];
                this.vinculacionesOtros = [];
                for (let i = 0; i < this.vinculaciones.length; i++) {
                  this.vinculaciones[i] = {
                    ...datosInfoVinculaciones[i],
                    ...{ FechaInicioVinculacion: this.vinculaciones[i].FechaInicioVinculacion ? this.corregirFecha(this.vinculaciones[i].FechaInicioVinculacion) : '' },
                    ...{ FechaFinVinculacion: this.vinculaciones[i].FechaFinVinculacion ? this.corregirFecha(this.vinculaciones[i].FechaFinVinculacion) : '' }
                  }
                  if (JSON.stringify(this.vinculaciones[i]) !== '{}') {
                    this.request.get(environment.PARAMETROS_SERVICE, `parametro/?query=Id:` + this.vinculaciones[i].TipoVinculacionId)
                      .subscribe((vinculacion: any) => {
                        this.vinculaciones[i].TipoVinculacion = vinculacion['Data'][0];
                        if (this.vinculaciones[i].DependenciaId) {
                          this.request.get(environment.OIKOS_SERVICE, `dependencia/` + this.vinculaciones[i].DependenciaId)
                            .subscribe((dependencia: any) => {
                              this.vinculaciones[i].Dependencia = dependencia;
                            }, (error) => {
                              console.log(error);
                            })
                        }
                        this.asignarVinculacion(this.vinculaciones[i]);
                      })
                  }
                }

              })
          }
        }, (error) => {
          console.log(error);
          Swal.close();
        })
    })



  }

}
