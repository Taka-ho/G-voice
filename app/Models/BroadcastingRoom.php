<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BroadcastingRoom extends Model
{
    use HasFactory;

    protected $table = 'broadcasting_rooms';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'room_names',
        'container_id',
        'room_explain',
        'broadcasting_flag',
    ];
}
