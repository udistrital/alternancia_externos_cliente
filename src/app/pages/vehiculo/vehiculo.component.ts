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
//import { Vinculacion } from '../../@core/models/vinculacion';
//import { CargaAcademica } from '../../@core/models/carga_academica';
import { LocalDataSource } from 'ng2-smart-table';
//import { combineLatest, from } from 'rxjs';
import { Router } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoFormDialogComponent } from './vehiculo-form-dialog.component';
@Component({
  selector: 'app-vehiculo',
  templateUrl: './vehiculo.component.html',
  styleUrls: ['./vehiculo.component.scss']
})
export class VehiculoComponent implements OnInit {
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;
   pestanaActiva: number = 0; 
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  readonly maxFileSize = 5242880; // 5 MB en bytes
  isPost: boolean = true;
  infoVacunacion: any[] = [{ dato: '' }, { dato: '' }, { dato: '' }, { dato: '' }, { dato: '' }, { dato: '' }];
  maxDate: Date = new Date();
  minDate: Date = new Date(2021, 0, 1);
  tercero: Tercero = {
    Id: 0,
    NombreCompleto: '',
    PrimerNombre: '',
    SegundoNombre: '',
    PrimerApellido: '',
    SegundoApellido: '',
    LugarOrigen: 0,
    FechaNacimiento: undefined,
    Activo: false,
    UsuarioWSO2: ''
  };
  datosIdentificacion: DatosIdentificacion | undefined ;
  datosGenero: InfoComplementariaTercero | undefined ;
  datosLocalidad: InfoComplementariaTercero | undefined ;
  //isVacunacion: number;
  //vinculacionesDocente: Vinculacion[];
  //vinculacionesEstudiante: Vinculacion[];
  //cargaAcademica: CargaAcademica[];
  //vinculacionesOtros: Vinculacion[];
  datosEstadoCivil: InfoComplementariaTercero | undefined ;
  //vinculaciones: Vinculacion[];
  
  edad: number | undefined ;
  source: LocalDataSource = new LocalDataSource();
  settings: any;
  epsLista: string[] = [];
  base64:any = null;
  enlace : string;
  extension: string;
  ifImagen: boolean;
  tipo_vehiculo: string;
  placa:string;
  ubicacion:any[]= [];
  vehiculo:any = {};
  vehiculo_inactivo:any = {};
  vehiculos:any[]= [];
  vehiculos_inactivos:any[]= [];
  nombreArchivo: string;
  imageSrc: any;
  base64String: any;
  fotoCarnet: string;
  data:any;
  
  //formVacunacion: FormGroup;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private dialog: MatDialog,
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
    this.tipo_vehiculo="";
    this.placa="";
   
 
    }

 
 
  ngOnInit(): void {
    this.userService.user$.subscribe((data) => {
      this.request.get(environment.TERCEROS_SERVICE, `datos_identificacion/?query=Numero:` + data['userService']['documento'])
        .subscribe((datosInfoTercero: any) => {
          this.datosIdentificacion = {
            ...datosInfoTercero[0]
          }
          this.tercero = this.datosIdentificacion.TerceroId;

          if (this.tercero) {
          
           this.cargarDatosAprobados();
           this.cargarDatosNoAprobados();
         
          }
        }, (error) => {
          console.log(error);
          Swal.close();
        })
    })



  }
  cargarDatosAprobados(): void{
        this.vehiculos=[];
         this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero/?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.CodigoAbreviacion:PARQUEADERO,Activo:true`)
              .subscribe((datosParqueadero: any) => {

                for (let i = 0; i < datosParqueadero.length; i++) {
                  this.vehiculo={};
                  this.vehiculo.tipoVehiculo = (JSON.parse(datosParqueadero[i].Dato)).tipoVehiculo;   
                  this.vehiculo.placa = (JSON.parse(datosParqueadero[i].Dato)).placa;
                  this.vehiculo.sedes = (JSON.parse(datosParqueadero[i].Dato)).sedes; 
                  this.vehiculo.activo = datosParqueadero[i].Activo; 
                  this.vehiculos.push(this.vehiculo);
                }
                 console.log(this.vehiculos);
              }, (error) => {
                console.log(error);
              })
  }
   cargarDatosNoAprobados(): void{
         this.vehiculos_inactivos=[];
         this.request.get(environment.TERCEROS_SERVICE, `info_complementaria_tercero/?query=TerceroId.Id:${!!this.tercero ? this.tercero.Id ? this.tercero.Id : '' : ''}`
              + `,InfoComplementariaId.GrupoInfoComplementariaId.CodigoAbreviacion:PARQUEADERO,Activo:false`)
              .subscribe((datosInactivos: any) => {

                for (let i = 0; i < datosInactivos.length; i++) {
                  this.vehiculo_inactivo={};
                  this.vehiculo_inactivo.tipoVehiculo = (JSON.parse(datosInactivos[i].Dato)).tipoVehiculo;   
                  this.vehiculo_inactivo.placa = (JSON.parse(datosInactivos[i].Dato)).placa;
                  this.vehiculo_inactivo.sedes = (JSON.parse(datosInactivos[i].Dato)).sedes; 
                  this.vehiculo_inactivo.activo = datosInactivos[i].Activo; 
                  this.vehiculos_inactivos.push(this.vehiculo_inactivo);
                }
                 console.log(this.vehiculos_inactivos);
              }, (error) => {
                console.log(error);
              })
  }
  openInsertDialog(): void {
    const dialogRef = this.dialog.open(VehiculoFormDialogComponent, {
      width: '400px',
      disableClose: true, // Evita que se cierre haciendo clic afuera
      data: { terceroid: this.tercero.Id} // Datos iniciales opcionales
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatosNoAprobados();
         this.pestanaActiva = 1; 
        // Aquí ejecutas tu servicio para guardar en la base de datos
      } else {
        console.log('El usuario canceló la acción.');
      }
    });
  }
  
 
 
}
