import { Component, ViewChild, ViewEncapsulation, OnInit, AfterViewInit } from '@angular/core';
import { QrScannerComponent } from 'angular2-qrscanner';
import Swal from 'sweetalert2';
import { RequestManager } from '../services/requestManager';
import { environment } from './../../../environments/environment';
import { UserService } from '../services/userService';
import { EspacioFisico } from 'src/app/@core/models/espacio_fisico';
import { LoaderService } from 'src/app/loader/loader.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-qrscan',
  templateUrl: './qrscan.component.html',
  styleUrls: ['./qrscan.component.scss']
})
export class QrscanComponent implements AfterViewInit {
  lectura: any = {};
  persona: any = {};
  @ViewChild(QrScannerComponent, { static: false }) 
  qrScannerComponent: QrScannerComponent;
  videoDevices: any = null;
  dispositivoActual: any = null;
  sedes:EspacioFisico[];
  //edificios:EspacioFisico[];
  //edificiosSeleccion={};
  sedeSeleccionada:string;
  edificioSeleccionado:string;
  idRol:number;
  //edificioActivado:boolean;
  sedeCambiada:boolean;
  //edificioCambiado:boolean;
  permisos:boolean;
  tipo:string;

  constructor(private request: RequestManager, private userService: UserService, public loaderService: LoaderService) {
    this.userService.tercero$.subscribe((tercero: any)=> {
      if (tercero.Id){
        this.request.get(environment.TERCEROS_SERVICE, `vinculacion/?query=Activo:true,TerceroPrincipalId.Id:${tercero.Id? tercero.Id : ''}`)
          .subscribe((datosInfoVinculaciones: any) => {
            if (datosInfoVinculaciones.length>0){
              this.idRol=datosInfoVinculaciones[0].TipoVinculacionId
              this.permisos = (this.idRol == 377 || this.idRol == 293 || this.idRol == 294 || (this.idRol >= 296 && this.idRol <= 299))
            }
          })
      }
    })
   }

  ngAfterViewInit(): void {
    this.cargarSedes()
    this.qrScannerComponent.getMediaDevices()
      .then((devices) => {
        this.videoDevices = devices.filter((video) => (video.kind === 'videoinput'));
      });
    this.qrScannerComponent.capturedQr.subscribe(async (result) => {      
      try{
        this.lectura = JSON.parse(atob(result));
        if (this.lectura.IdTercero && this.permisos){
          this.consultarAcceso()
        }
        else if(this.lectura.IdEspacio){
          this.accesoEspacio()
        }
        else{
          Swal.fire({
            title: 'Error',
            text: `Error escaneando QR, por favor escanea nuevamente`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
          })
          this.dispositivoActual = null;
        }
      }catch(error){
        console.log(error);
        Swal.fire({
          title: 'Error',
          text: `Error escaneando QR, por favor escanea nuevamente`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
        })
        this.dispositivoActual = null;
      }
    }, (error) => {
      console.log(error);
      Swal.fire({
        title: 'Error',
        text: `Error escaneando QR, por favor escanea nuevamente`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    });
  }

  selectDevice(device) {
    this.dispositivoActual = device;
    this.qrScannerComponent.chooseCamera.next(device);
  }

  clear() {
    this.dispositivoActual = null;
    this.lectura = ''
  }

  accesoEspacio(){
    let id:string
    this.userService.tercero$.subscribe((tercero: any)=> {
      id = tercero['Id']
    })
    this.request.get(environment.ALTERNANCIA_MID_SERVICE, `acceso/${id}/${this.lectura.IdEspacio}/${this.lectura.tipo}`)
    .subscribe(async(respuesta: any) => {
      this.persona =await respuesta["Data"];
      if (this.persona.Acceso=="No autorizado"){
        const { value: accept } = await Swal.fire({
          title:'Control de aforo',
          icon: 'error',
          html:`<p class="text-term-condional">
            <b>Usuario:</b> ${this.persona.Nombre}<br>
            <b>Fecha:</b> ${this.persona.Fecha}<br>
            <b>Acceso:</b> ${this.persona.Acceso}<br>
            <b>Causa:</b> ${this.persona.Causa}<br>
            <b>Cupo restante:</b> ${this.persona.Cupo}<br></p>`,
          confirmButtonText: 'Aceptar',
        })
      }
      else{
        const { value: accept } = await Swal.fire({
          title:'Control de aforo',
          icon: 'success',
          html:`<p class="text-term-condional">
            <b>Usuario:</b> ${this.persona.Nombre}<br>
            <b>Fecha:</b> ${this.persona.Fecha}<br>
            <b>Acceso:</b> ${this.persona.Acceso}<br>
            <b>Cupo restante:</b> ${this.persona.Cupo}<br><br>
            <center>Puede continuar</center></p>`,
          confirmButtonText: 'Aceptar',
        })
      }
    }, (error) => {
      console.log(error);
      Swal.close();
      Swal.fire({
        title: 'Error',
        text: `Error consultando datos, por favor escanea nuevamente`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    });
  this.dispositivoActual = null;
  return
  }

  consultarAcceso(){
    this.userService.tercero$.subscribe((tercero: any)=> {
      this.request.get(environment.ALTERNANCIA_MID_SERVICE, `acceso/${this.lectura.IdTercero}/${tercero['Id']}/?sede=${this.sedeSeleccionada}&tipo=${this.tipo}${this.edificioSeleccionado?"&edificio="+this.edificioSeleccionado:""}`)
        .subscribe(async(respuesta: any) => {          
          this.persona =await respuesta["Data"];
          let codeHtml=`
              <h3 class="title-term-conditional">Control de aforo</h3>
              <p class="text-term-condional">
              <b>Usuario:</b> ${this.persona.Nombre}<br>
              <b>Identificación:</b> ${this.lectura.cc}<br>
              <b>Ingreso:</b> ${this.persona.Acceso}<br>`
          if(this.persona.Causa!=""){
            codeHtml=codeHtml+`<b>Causa:</b> ${this.persona.Causa}<br>`
          }
          codeHtml=codeHtml+`<b>Cupo restante:</b> ${this.persona.Cupo}<br>
          </p>`
          const { value: accept } = await Swal.fire({
            html: codeHtml,
            icon: this.persona.Acceso=="Autorizado"?'success':'error',
            confirmButtonText: 'Aceptar',
          })
        }, (error) => {
          console.log(error);
          Swal.close();
          Swal.fire({
            title: 'Error',
            text: `Error consultando datos, por favor verifica los datos de ingreso y escanea nuevamente`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
          })
        });
      })
      this.dispositivoActual = null;
      return
  }

  cambioSede(idSede:string){
    this.sedeCambiada=true
    /*this.edificioSeleccionado=""
    if(this.edificiosSeleccion[idSede].length>0){
      this.edificioActivado=true
      this.edificios=this.edificiosSeleccion[idSede]
      this.edificioCambiado=false
    }
    else{
      this.edificioActivado=false
      this.edificioCambiado=true
    }*/
  }

  /*cambioEdificio(){
    this.edificioCambiado=true
  }*/

  cargarSedes(){
    this.request.get(environment.OIKOS_SERVICE,"espacio_fisico/?limit=-1&query=TipoEspacio.Id:1")
    .subscribe((res :any) =>{
      if (res != [] && res!=null){
        this.sedes=res
        //this.cargarEdificios()
      }
    }, (error) => {
      console.log(error);
    });
  }

  /*cargarEdificios(){
    this.edificiosSeleccion={}
    for (let sede of this.sedes){
      try{
        this.request.get(environment.OIKOS_SERVICE,"espacio_fisico_padre/?limit=-1&query=Padre.Id:"+sede.Id)
        .subscribe((res :any) =>{
          let edificios:EspacioFisico[]=[]
          for(let respuesta of res){
            if(respuesta.Hijo){
              edificios.push(respuesta.Hijo)
            }
          }
          this.edificiosSeleccion[sede.Id.toString()]=edificios
        }, (error:HttpErrorResponse) => {
          this.edificiosSeleccion[sede.Id.toString()]=[]
          console.log(error);
        });
      }
      catch(error){
        this.edificiosSeleccion[sede.Id.toString()]=[]
        console.log(error);
      }
    }
  }*/
}
