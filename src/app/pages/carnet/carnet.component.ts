import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { RequestManager } from '../services/requestManager';
import Swal from 'sweetalert2';
import { UserService } from '../services/userService';
import { UtilService } from '../services/utilService';
import { DatosIdentificacion } from '../../@core/models/datos_identificacion';
import { environment } from '../../../environments/environment'
import { InfoComplementariaTercero } from '../../@core/models/info_complementaria_tercero';
import { Tercero } from '../../@core/models/tercero';
import { Documento } from '../../@core/models/documento';
import { Vinculacion } from '../../@core/models/vinculacion';
import { LocalDataSource } from 'ng2-smart-table';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-carnet',
  templateUrl: './carnet.component.html',
  styleUrls: ['./carnet.component.scss']
})
export class CarnetComponent implements OnInit {
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;

  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  readonly maxFileSize = 5242880; // 5 MB en bytes
  isPost: boolean = true;
  infoVacunacion: any[] = [{ dato: '' }, { dato: '' }, { dato: '' }, { dato: '' }, { dato: '' }, { dato: '' }];
  maxDate: Date = new Date();
  minDate: Date = new Date(2021, 0, 1);
  tercero: Tercero | undefined ;
  datosIdentificacion: DatosIdentificacion | undefined ;
  datosGenero: InfoComplementariaTercero | undefined ;
  datosLocalidad: InfoComplementariaTercero | undefined ;
  datosEstadoCivil: InfoComplementariaTercero | undefined ;
  vinculaciones: Vinculacion[]= [];
  vinculacion:Vinculacion | undefined ;
  infoComplementariaId: number | undefined ;
  infoComplementariaTerceroId: number | undefined ;
  edad: number | undefined ;
  source: LocalDataSource = new LocalDataSource();
  settings: any;
  epsLista: string[] = [];
  base64:any = null;
  enlace : string;
  extension: string;
  ifImagen: boolean;
  RH: string;
  nombreArchivo: string;
  imageSrc: any;
  base64String: any;
  fotoCarnet: string;
  data:any;
  isClickEnabled: boolean = false; 
  opcionSeleccionada: any = null;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private sanitizer:DomSanitizer,
    private utilService: UtilService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.ifImagen=false;
    this.enlace="";
    this.extension="";
    this.nombreArchivo="";
    this.fotoCarnet="";
    this.RH="";
 
    }

 
 public corregirFecha(fecha: string): Date {
    let fechaHora = new Date(fecha);
    fechaHora.setHours(fechaHora.getHours() + 5);
    return fechaHora;
  }
  //OJO ids quemados ponerlos en los enviroments ya que no necesariamente tienen el mismo id en todos los ambientes

  public asignarVinculacion(vinculacion: Vinculacion) {
    let idRol: number = vinculacion.TipoVinculacion.Id;


    if (idRol == 290 || idRol == 291 ) {
        vinculacion.TipoVinculacion.Nombre = 'CONTRATISTA';
      }
      if (idRol == 346 ) {
        vinculacion.TipoVinculacion.Nombre = 'ESTUDIANTE';
      }
      if (idRol == 300 || idRol == 301 || idRol == 302 || idRol == 303 || idRol == 304 || idRol == 305 || idRol == 306 || idRol == 307 || idRol == 311 || idRol == 347 ) {
        vinculacion.TipoVinculacion.Nombre = 'FUNCIONARIO';
      }
      if (idRol == 292 || idRol == 293 || idRol == 294 || idRol == 295 || idRol == 296 || idRol == 297 || idRol == 298 || idRol == 299 ) {
        vinculacion.TipoVinculacion.Nombre = 'DOCENTE';
      }

  }

  ngOnInit(): void {
     Swal.fire({
      title: 'Cargando datos...',
      text: 'Por favor, espere un momento.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading(); // Muestra el spinner de carga clásico
      }
    });
    this.request.get(environment.TERCEROS_SERVICE, `info_complementaria?query=CodigoAbreviacion:FOTOCARNET`)
    .subscribe((datosInfoComplementaria: any) => {
          this.infoComplementariaId = datosInfoComplementaria[0].Id;
          
    });
    this.userService.user$.subscribe((data) => {
      this.request.get(environment.TERCEROS_SERVICE, `datos_identificacion/?query=Numero:` + data['userService']['documento'])
        .subscribe((datosInfoTercero: any) => {
          this.datosIdentificacion = {
            ...datosInfoTercero[0],
            ...{ FechaExpedicion: datosInfoTercero[0].FechaExpedicion ? this.corregirFecha(datosInfoTercero[0].FechaExpedicion) : '' }
          }
          this.tercero = this.datosIdentificacion.TerceroId;

          if (this.tercero) {
          
             this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.Id:7,Activo:true`)
             .subscribe((grupoSanguineo: any) => {
               
                
                 this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.Id:8,Activo:true`)
             .subscribe((factor: any) => {
                 this.RH=grupoSanguineo[0].InfoComplementariaId.Nombre+factor[0].InfoComplementariaId.Nombre;
               
              }, (error) => {
                console.log(error);
              });   
              }, (error) => {
                console.log(error);
              });
            this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero/?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.CodigoAbreviacion:FOTOCARNET,Activo:true`)
              .subscribe((fotoCarnet: any) => {
                    if(JSON.stringify(fotoCarnet[0]) !== '{}')
                    {
                    this.fotoCarnet = (JSON.parse(fotoCarnet[0].Dato)).dato;
                    this.infoComplementariaTerceroId = fotoCarnet[0].Id;
                    this.request.get(environment.GESTOR_DOCUMENTAL, 'document/'+ this.fotoCarnet).subscribe((imagen_base64: any) => {

                        const reader = new FileReader();
                      reader.onload = () => {
                        this.imagePreview = reader.result;
                        }
                        
                        const imageBlob = this.base64ToBlob(imagen_base64.file, 'image/png');
                        reader.readAsDataURL(imageBlob);
                        this.enableClick();  
                         Swal.close();
                      },
                      error => {
                        Swal.fire({
                          title: 'error',
                          text: `${JSON.stringify(error)}`,
                          icon: 'error',
                          showCancelButton: true,
                          cancelButtonText: 'Cancelar',
                          confirmButtonText: `Aceptar`,
                        });
                      });
                     } else
                      {
                        Swal.close();
                        this.enableClick();  
                      }  
               
                     

              }, (error) => {
                console.log(error);
              })

         

            this.request.get(environment.TERCEROS_SERVICE, `vinculacion/?query=Activo:true,TerceroPrincipalId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}&sortby=FechaFinVinculacion&order=desc`)
              .subscribe((datosInfoVinculaciones: any) => {
                this.vinculaciones = datosInfoVinculaciones;
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
                        this.vinculacion=vinculacion['Data'][0];
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
                if (this.vinculaciones && this.vinculaciones.length > 0) {
                         this.opcionSeleccionada = this.vinculaciones[0];
                  }
              })
          }
        }, (error) => {
          console.log(error);
          Swal.close();
        })
    })


    
  
  }
  obtenerImagen(enlace: string){
   this.request.get(environment.GESTOR_DOCUMENTAL,'document/' + enlace).
    subscribe((documento)=>{
      this.base64String = documento['file'];
      this.imageSrc = this.convertBase64ToImageSrc(this.base64String);
    })
  }
  convertBase64ToImageSrc(base64String: string): any {
    // Convertir la cadena base64 a una URL de objeto
    const imageBlob = this.base64ToBlob(base64String, 'image/png');
    const imageUrl = URL.createObjectURL(imageBlob);
    // Sanitizar la URL para prevenir problemas de seguridad
    return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
  }
 
  base64ToBlob(base64String: string, type: string): Blob {
    // Obtener el contenido binario de la cadena base64
    const byteCharacters = atob(base64String);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    // Crear un objeto Blob a partir de los byteArrays
    return new Blob(byteArrays, { type: type });
  }
  
 onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    this.resetForm();

    if (!file) return;

    if (!this.allowedTypes.includes(file.type)) {
      this.errorMessage = 'Formato inválido. Usa .jpg, .jpeg o .png';
      event.target.value = ''; 
      return;
    }

    if (file.size > this.maxFileSize) {
      this.errorMessage = 'La imagen excede el límite máximo de 5 MB';
      event.target.value = ''; 
      return;
    }
    



    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
      const base64String = (reader.result as string).split(',')[1];
        this.base64 = base64String; 
        let validarImagen = {imagen_base64: this.base64};
                 
                  this.request.post(environment.VALIDAR_IMAGEN, '/rostro/validar', JSON.stringify(validarImagen))
                  .subscribe((data: any) => {
                    
                    if(data.Data.valida&&data.Data.tiene_rostro&&data.Data.es_rostro_humano)
                    {
                      this.selectedFile = file;
                    }
                    else
                    {
                         this.errorMessage = 'No se detecta un rostro humano en la imagen';

                    }

                  },
                  error => {
                    Swal.fire({
                      title: 'error',
                      text: `${JSON.stringify(error)}`,
                      icon: 'error',
                      showCancelButton: true,
                      cancelButtonText: 'Cancelar',
                      confirmButtonText: `Aceptar`,
                    });
                  });
    };
    
    
    reader.readAsDataURL(file);
  }
  onUpload(): void {
    if (!this.selectedFile) return;

      const documento :Documento ={
              IdTipoDocumento : 202,
              nombre : 'carnet_' +this.tercero.Id+'.'+ this.selectedFile.type.split("/")[1],
              metadatos :{},
              descripcion:"Imagen de carnet",
              file : this.base64      
            }
             let array = [documento];
             this.request.post(environment.GESTOR_DOCUMENTAL, 'document/upload', array)
             .subscribe((data: any) => {
                    
                    this.enlace = data['res'].Enlace;
                    

              if (this.enlace) {
               

                let itemInfoComplementariaTercero = 
                {
                  TerceroId: { Id: this.tercero.Id },
                  InfoComplementariaId: {
                    Id: this.infoComplementariaId,
                  },
                  Dato: JSON.stringify({ dato: this.enlace }),
                  Activo: true
                  };
                  if(this.fotoCarnet)
                  {
                     

                       this.request
                    .put(environment.TERCEROS_SERVICE, '/info_complementaria_tercero', itemInfoComplementariaTercero, this.infoComplementariaTerceroId)
                    .subscribe((data: any) => {
                      Swal.fire({
                        title: 'informacion',
                        text: `imagen guardada correctamente`,
                        icon: 'success',
                        showCancelButton: false,
                        confirmButtonText: `Aceptar`,
                      });
                    

                    },
                    error => {
                      Swal.fire({
                        title: 'error',
                        text: `${JSON.stringify(error)}`,
                        icon: 'error',
                        showCancelButton: true,
                        cancelButtonText: 'Cancelar',
                        confirmButtonText: `Aceptar`,
                      });
                    });
                 

                  }
                  else
                  {
                    this.request
                    .post(environment.TERCEROS_SERVICE, 'info_complementaria_tercero/', itemInfoComplementariaTercero)
                    .subscribe((data: any) => {
                      Swal.fire({
                        title: 'informacion',
                        text: `imagen guardada correctamente`,
                        icon: 'success',
                        showCancelButton: false,
                        confirmButtonText: `Aceptar`,
                      });
                    

                    },
                    error => {
                      Swal.fire({
                        title: 'error',
                        text: `${JSON.stringify(error)}`,
                        icon: 'error',
                        showCancelButton: true,
                        cancelButtonText: 'Cancelar',
                        confirmButtonText: `Aceptar`,
                      });
                    });
                  }
                }
              },
              error => {
              Swal.fire({
                      title: 'error',
                      text: `${JSON.stringify(error)}`,
                      icon: 'error',
                      showCancelButton: true,
                      cancelButtonText: 'Cancelar',
                      confirmButtonText: `Aceptar`,
                    });
                  });

   
  }
   private resetForm(): void {
    this.errorMessage = null;
    this.imagePreview = null;
    this.selectedFile = null;
  }

  ejecutarAccion(opcion: any): void {
    // 1. Guardamos todo el objeto seleccionado
    this.opcionSeleccionada = opcion;

    // 2. Aquí ejecutas la lógica que ya tenías para la acción
    const accion = opcion.accion;
    console.log('Ejecutando acción:', accion);
    
    // Tu lógica de negocio aquí...
  }

  trackByAccion(index: number, item: any): string {
    return item.accion;
  }

  // Llama a esta función para activar el clic cuando lo necesites
  enableClick(): void {
    this.isClickEnabled = true;
  }

  // Llama a esta función para volver a bloquearlo
  disableClick(): void {
    this.isClickEnabled = false;
  }
 
}
