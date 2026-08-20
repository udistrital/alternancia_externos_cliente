import { Component,  Inject,  OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RequestManager } from '../services/requestManager';
import { environment } from '../../../environments/environment'
import { Documento } from 'src/app/@core/models/documento';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-dialog-vehiculo',
  templateUrl: './vehiculo-form-dialog.component.html',
  styleUrls: ['./vehiculo-form-dialog.component.scss']
})
export class VehiculoFormDialogComponent implements OnInit{
   vehiculoForm: FormGroup;
   enlace:string="";
   tipoVehiculosLista:any[]= [];
   horariosLista:any[]= [];
   seleccionado:any;
   parqueaderosLista:any[]= [];
   infoComplementariaId: number | undefined ;
   pre: string="";
   tipoDocumento:number | undefined ;
   enlaceDocumento: string="";
   enlaceSoporte: string="";
   datosForm: any={};
  constructor(
    private request: RequestManager,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehiculoFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { terceroid: number }
  ) {}
   ngOnInit(): void {
    if (!this.data || this.data.terceroid === undefined || this.data.terceroid === null || this.data.terceroid <= 0) {
      console.error('Error: El parámetro "terceroid" es inválido o no fue enviado:', this.data);
      alert('Error crítico: No se cargó la información del tercero asociado. El formulario se cerrará.');
      
    }
    // Inicialización del formulario reactivo
    this.cargarTiposVehiculos();
    this.cargarHorarios();
    this.cargarParqueaderos();
    this.seleccionado = this.tipoVehiculosLista[0]; 
    this.vehiculoForm = this.fb.group({
      placa: ['', Validators.required],
      tipoVehiculo: ['BICICLETA'],
      horario: ['Fin de Semana'],
      registradaMovilidad: [''] ,
      documentoIdentidadPdf: [null, Validators.required], // Obligatorio siempre
      tarjetaPropiedadPdf: [null],
       sedes: this.fb.array([]) 
    });
    this.vehiculoForm.get('tipoVehiculo')?.valueChanges.subscribe(valor => {
      console.log('El usuario cambió el tipo de vehículo a:', valor);
    });
    this.request.get(environment.TERCEROS_SERVICE, `info_complementaria?query=CodigoAbreviacion:VEHICULO`)
    .subscribe((datosInfoComplementaria: any) => {
          this.infoComplementariaId = datosInfoComplementaria[0].Id;
          
    });
    
  }
  // Closes the modal and sends 'true' back to the parent
  async onConfirm(): Promise<void> {
  // Validación inicial del formulario
  if (this.vehiculoForm.invalid) {
    this.vehiculoForm.markAllAsTouched();
    alert('Por favor, complete todos los campos obligatorios del formulario.');
    return;
  }

  if (this.sedesFormArray.length === 0) {
    alert('Por favor, seleccione al menos una sede.');
    return;
  }

  try {
    // Extraemos una copia de los valores actuales del formulario
    this.datosForm = { ...this.vehiculoForm.value };
    
    // Capturamos los archivos físicos desde el formulario
    const documentoFile = this.vehiculoForm.get('documentoIdentidadPdf')?.value;
    const tarjetaFile = this.vehiculoForm.get('tarjetaPropiedadPdf')?.value;

    // Convertimos el Documento de Identidad (Siempre obligatorio)
    if (documentoFile instanceof File) {
        const documento64=await this.cambiarABase64(documentoFile)
       this.enlaceDocumento=  await this.guardarPDF(documentoFile,documento64 ,'documentoIdentidadPdf');
       this.datosForm.enlaceDocumento= this.enlaceDocumento;
    }

    // Convertimos la Tarjeta de Propiedad (Siempre obligatorio)
    if (tarjetaFile instanceof File) {
      const documento64=await this.cambiarABase64(tarjetaFile)
      this.enlaceSoporte= await this.guardarPDF(documentoFile, documento64 ,'tarjetaPropiedadPdf');
      this.datosForm.enlaceSoporte= this.enlaceSoporte;
    } 
    if(this.enlaceDocumento!=="" && this.enlaceSoporte!=="")
    {
      this.guardarInfoComplementaria(this.datosForm);
    }
    
    // 3. ENVÍO AL API: Enviamos el objeto JSON limpio con los strings en Base64
    
     this.dialogRef.close(true);
   

  } catch (error) {
    console.error('Error durante la conversión de los archivos a Base64:', error);
    alert('No se pudieron procesar los archivos PDF seleccionados.');
  }
  }
  private cambiarABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Lee el archivo como una URL de datos Base64
    reader.onload = () => {
      // El resultado viene con un prefijo (ej: "data:application/pdf;base64,...")
      // Extraemos solo la cadena Base64 pura separando por la coma
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}
private guardarPDF(selectedFile: File, base64:any, tipo:string) :  Promise<string>
{
    return new Promise((resolve) => {
  if(tipo==='documentoIdentidadPdf')
  {
    this.pre="documento";
    this.tipoDocumento=203;
  }
  else
  {
    this.pre="soporte";
    this.tipoDocumento=204;
  }
  const documento :Documento ={
                IdTipoDocumento :  this.tipoDocumento,
                nombre : this.pre +this.data.terceroid+'.'+ selectedFile.type.split("/")[1],
                metadatos :{},
                descripcion:tipo,
                file : base64      
              }
               let array = [documento];
               this.request.post(environment.GESTOR_DOCUMENTAL, 'document/upload', array)
               .subscribe((data: any) => {
                      
                     
                      
  
               
                         resolve(data['res'].Enlace);
                
                  
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
             }); 
        }
  // Closes the modal and sends 'false' back to the parent
  onCancel(): void {
    this.dialogRef.close(false);
  }
  public guardarInfoComplementaria(dato:any)
  {
    
                  let itemInfoComplementariaTercero = 
                  {
                    TerceroId: { Id: this.data.terceroid },
                    InfoComplementariaId: {
                      Id: this.infoComplementariaId,
                    },
                    Dato: JSON.stringify(dato),
                    Activo: false
                    };
                   
                       
  
                         this.request
                      .post(environment.TERCEROS_SERVICE, '/info_complementaria_tercero', itemInfoComplementariaTercero)
                      .subscribe((data: any) => {
                        Swal.fire({
                          title: 'informacion',
                          text: `Solicitud guardada correctamente`,
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
   public cargarTiposVehiculos(){
    this.request.get(environment.PARAMETROS_SERVICE,"parametro/?limit=-1&query=TipoParametroId.Id:180,Activo:true&order=asc&sortby=Nombre")
    .subscribe((res:any)=>{
      var lista=res.Data
      lista.forEach(reg=>{
        this.tipoVehiculosLista.push(reg.Nombre)
      })
    })
  }
  public cargarHorarios(){
    this.request.get(environment.PARAMETROS_SERVICE,"parametro/?limit=-1&query=TipoParametroId.Id:181,Activo:true&order=asc&sortby=Nombre")
    .subscribe((res:any)=>{
      var lista=res.Data
      lista.forEach(reg=>{
        this.horariosLista.push(reg.Nombre)
      })
    })
  }
  public cargarParqueaderos(){
    this.request.get(environment.PARAMETROS_SERVICE,"parametro/?limit=-1&query=TipoParametroId.Id:182,Activo:true&order=asc&sortby=Nombre")
    .subscribe((res:any)=>{
      var lista=res.Data
      lista.forEach(reg=>{
        this.parqueaderosLista.push(reg.Nombre)
      })
    })
    console.log(this.parqueaderosLista);
  }
  
  // Función para capturar el archivo PDF y asignarlo al Formulario
  onFileSelected(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validación opcional: Asegurar que sea estrictamente un PDF
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecciona un archivo en formato PDF.');
        input.value = ''; // Limpia el input nativo
        return;
      }

      // Asignamos el archivo binario directamente al control del formulario
      this.vehiculoForm.get(controlName)?.setValue(file);
      this.vehiculoForm.get(controlName)?.updateValueAndValidity();
    }
  }

  // Función auxiliar para obtener el nombre del archivo en la interfaz
  getFileName(controlName: string): string {
    const file = this.vehiculoForm.get(controlName)?.value;
    return file ? file.name : 'Ningún archivo seleccionado';
  }
  get sedesFormArray(): FormArray {
    return this.vehiculoForm.get('sedes') as FormArray;
  }

  // Verifica si una sede específica ya se encuentra dentro del array
  isSedeSeleccionada(sede: string): boolean {
    return this.sedesFormArray.value.includes(sede);
  }

  // Determina si el checkbox "TODAS" debe mostrarse marcado
  isTodasMarcadas(): boolean {
    return this.sedesFormArray.length === this.parqueaderosLista.length;
  }

  // Acción al hacer clic en "TODAS"
  onChangeTodas(marcado: boolean): void {
    this.sedesFormArray.clear(); // Limpiamos el array por completo

    if (marcado) {
      // Si marca todas, insertamos cada sede de la lista en el FormArray
      this.parqueaderosLista.forEach(sede => {
        this.sedesFormArray.push(new FormControl(sede));
      });
    }
  }

  // Acción al hacer clic en una sede individual
  onChangeSubsede(marcado: boolean, sede: string): void {
    if (marcado) {
      // Si la selecciona, la añadimos al array
      this.sedesFormArray.push(new FormControl(sede));
    } else {
      // Si la desmarca, buscamos su índice y la removemos del array
      const index = this.sedesFormArray.value.findIndex((x: string) => x === sede);
      if (index >= 0) {
        this.sedesFormArray.removeAt(index);
      }
    }
  }  
}